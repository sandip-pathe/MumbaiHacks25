"""
Jira Service
Manages Jira integration including credentials and ticket operations
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from uuid import UUID
from loguru import logger

from app.core.jira_client import jira_client
from app.database import db
from app.models.schemas import JiraTicketCreate, JiraTicketResponse


class JiraService:
    """Service for managing Jira integration"""
    
    async def store_credentials(
        self,
        user_id: str,
        access_token: str,
        refresh_token: str,
        cloud_id: str,
        site_url: str,
        site_name: str,
        expires_in: int
    ):
        """Store user's Jira OAuth credentials"""
        expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        
        async with db.acquire() as conn:
            await conn.execute("""
                INSERT INTO jira_credentials 
                (user_id, access_token, refresh_token, cloud_id, site_url, site_name, expires_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (user_id) 
                DO UPDATE SET 
                    access_token = EXCLUDED.access_token,
                    refresh_token = EXCLUDED.refresh_token,
                    cloud_id = EXCLUDED.cloud_id,
                    site_url = EXCLUDED.site_url,
                    site_name = EXCLUDED.site_name,
                    expires_at = EXCLUDED.expires_at,
                    updated_at = NOW()
            """, user_id, access_token, refresh_token, cloud_id, site_url, site_name, expires_at)
        
        logger.info(f"Stored Jira credentials for user {user_id}")
    
    async def get_credentials(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user's Jira credentials, refresh if expired"""
        async with db.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT * FROM jira_credentials WHERE user_id = $1
            """, user_id)
            
            if not row:
                return None
            
            credentials = dict(row)
            
            # Check if token is expired or about to expire
            if credentials['expires_at'] <= datetime.utcnow() + timedelta(minutes=5):
                logger.info(f"Refreshing Jira token for user {user_id}")
                
                token_data = await jira_client.refresh_access_token(
                    credentials['refresh_token']
                )
                
                # Update stored credentials
                new_expires_at = datetime.utcnow() + timedelta(seconds=token_data['expires_in'])
                
                await conn.execute("""
                    UPDATE jira_credentials 
                    SET access_token = $1, expires_at = $2, updated_at = NOW()
                    WHERE user_id = $3
                """, token_data['access_token'], new_expires_at, user_id)
                
                credentials['access_token'] = token_data['access_token']
                credentials['expires_at'] = new_expires_at
            
            return credentials
    
    async def delete_credentials(self, user_id: str):
        """Delete user's Jira credentials"""
        async with db.acquire() as conn:
            await conn.execute("""
                DELETE FROM jira_credentials WHERE user_id = $1
            """, user_id)
        
        logger.info(f"Deleted Jira credentials for user {user_id}")
    
    async def create_ticket_from_violation(
        self,
        user_id: str,
        violation_id: str,
        case_id: str,
        project_key: str,
        issue_type: str = "Bug",
        priority: str = "Medium",
        assignee: Optional[str] = None
    ) -> JiraTicketResponse:
        """Create Jira ticket from a compliance violation"""
        
        # Get user's Jira credentials
        credentials = await self.get_credentials(user_id)
        if not credentials:
            raise Exception("Jira not connected. Please authenticate first.")
        
        # Get violation details
        async with db.acquire() as conn:
            violation = await conn.fetchrow("""
                SELECT v.*, r.full_name as repo_name
                FROM violations v
                LEFT JOIN scans s ON v.scan_id = s.scan_id
                LEFT JOIN repos r ON s.repo_id = r.repo_id
                WHERE v.violation_id = $1
            """, UUID(violation_id))
            
            if not violation:
                raise Exception(f"Violation {violation_id} not found")
            
            violation_dict = dict(violation)
        
        # Build ticket content
        summary = f"[Compliance] {violation_dict.get('explanation', 'Violation')[:100]}"
        
        description = f"""
**Compliance Violation Detected**

**Rule:** {violation_dict.get('rule_id', 'N/A')}
**Severity:** {violation_dict.get('severity', 'Unknown')}
**Verdict:** {violation_dict.get('verdict', 'Unknown')}

**Explanation:**
{violation_dict.get('explanation', 'No explanation available')}

**Evidence:**
{violation_dict.get('evidence', 'No evidence provided')}

**File:** {violation_dict.get('file_path', 'N/A')}
**Lines:** {violation_dict.get('start_line', 'N/A')}-{violation_dict.get('end_line', 'N/A')}

**Repository:** {violation_dict.get('repo_name', 'N/A')}
**Violation ID:** {violation_id}
        """.strip()
        
        # Create Jira issue
        issue_response = await jira_client.create_issue(
            cloud_id=credentials['cloud_id'],
            access_token=credentials['access_token'],
            project_key=project_key,
            summary=summary,
            description=description,
            issue_type=issue_type,
            priority=priority,
            assignee=assignee
        )
        
        jira_key = issue_response['key']
        jira_id = issue_response['id']
        jira_url = f"https://{credentials['site_url']}/browse/{jira_key}"
        
        # Store ticket in database
        async with db.acquire() as conn:
            await conn.execute("""
                INSERT INTO jira_tickets 
                (violation_id, case_id, user_id, jira_ticket_id, jira_ticket_key, 
                 jira_ticket_url, project_key, issue_type, priority, status, assignee)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            """, UUID(violation_id), UUID(case_id) if case_id else None, user_id, jira_id, jira_key, jira_url,
                project_key, issue_type, priority, "To Do", assignee)
            
            # Update violation with ticket ID
            await conn.execute("""
                UPDATE violations
                SET jira_ticket_id = $1
                WHERE violation_id = $2
            """, jira_key, UUID(violation_id))
        
        logger.info(f"Created Jira ticket {jira_key} for violation {violation_id}")
        
        return JiraTicketResponse(
            ticket_id=jira_id,
            ticket_key=jira_key,
            ticket_url=jira_url,
            status="To Do",
            created_at=datetime.utcnow()
        )
    
    async def sync_ticket_status(self, user_id: str, ticket_id: str):
        """Sync Jira ticket status back to our database"""
        
        credentials = await self.get_credentials(user_id)
        if not credentials:
            raise Exception("Jira not connected")
        
        async with db.acquire() as conn:
            ticket = await conn.fetchrow("""
                SELECT * FROM jira_tickets WHERE id = $1 AND user_id = $2
            """, UUID(ticket_id), user_id)
            
            if not ticket:
                raise Exception("Ticket not found")
            
            # Get latest status from Jira
            issue_data = await jira_client.get_issue(
                cloud_id=credentials['cloud_id'],
                access_token=credentials['access_token'],
                issue_key=ticket['jira_ticket_key']
            )
            
            new_status = issue_data['fields']['status']['name']
            assignee = issue_data['fields'].get('assignee', {})
            assignee_id = assignee.get('accountId') if assignee else None
            
            # Update our database
            await conn.execute("""
                UPDATE jira_tickets 
                SET status = $1, assignee = $2, last_synced_at = NOW()
                WHERE id = $3
            """, new_status, assignee_id, UUID(ticket_id))
            
            logger.info(f"Synced ticket {ticket['jira_ticket_key']}: {new_status}")
            
            return {"status": new_status, "assignee": assignee_id}
    
    async def get_user_tickets(self, user_id: str, case_id: Optional[str] = None):
        """Get all Jira tickets for a user or case"""
        query = "SELECT * FROM jira_tickets WHERE user_id = $1"
        params = [user_id]
        
        if case_id:
            query += " AND case_id = $2"
            params.append(UUID(case_id))
        
        query += " ORDER BY created_at DESC"
        
        async with db.acquire() as conn:
            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]


# Global service instance
jira_service = JiraService()
