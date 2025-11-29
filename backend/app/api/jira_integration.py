"""
Jira Integration API Endpoints
OAuth 2.0 authentication and ticket management
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import RedirectResponse
from typing import Optional
import secrets
from loguru import logger
from uuid import UUID

from app.core.jira_client import jira_client
from app.services.jira_service import jira_service
from app.services.auth_service import auth_service
from app.api.auth import get_current_user
from app.models.schemas import (
    JiraTicketCreate,
    JiraTicketResponse,
    JiraConnectionStatus,
    SuccessResponse
)

router = APIRouter(prefix="/api/jira", tags=["Jira Integration"])

# OAuth state storage (in production, use Redis)
oauth_states = {}


@router.get("/connect")
async def initiate_jira_oauth(current_user: dict = Depends(get_current_user)):
    """
    Initiate Jira OAuth flow
    
    Returns authorization URL for user to login to Jira
    """
    user_id = current_user['id']
    state = secrets.token_urlsafe(32)
    oauth_states[state] = user_id
    
    auth_url = jira_client.get_authorization_url(state)
    
    return {
        "authorization_url": auth_url,
        "state": state,
        "message": "Redirect user to authorization_url to complete OAuth"
    }


@router.get("/callback")
async def jira_oauth_callback(
    code: str = Query(...),
    state: str = Query(...)
):
    """
    Handle Jira OAuth callback - Returns JSON like GitHub OAuth
    
    Exchanges authorization code for access token and returns site info
    """
    logger.info(f"=== Jira OAuth Callback Received ===")
    logger.info(f"Code: {code[:20]}... State: {state[:20]}...")
    
    # Verify state
    user_id = oauth_states.get(state)
    if not user_id:
        logger.error(f"Invalid OAuth state: {state}")
        raise HTTPException(status_code=400, detail="Invalid OAuth state")
    
    try:
        logger.info(f"Processing Jira OAuth callback for user {user_id}")
        
        # Exchange code for token
        token_data = await jira_client.exchange_code_for_token(code)
        logger.info(f"Token exchange successful")
        
        # Get accessible Jira sites
        resources = await jira_client.get_accessible_resources(
            token_data['access_token']
        )
        
        if not resources:
            logger.error("No Jira sites accessible")
            raise HTTPException(status_code=400, detail="No Jira sites accessible")
        
        # Use first accessible site
        site = resources[0]
        logger.info(f"Using Jira site: {site['name']}")
        
        # Store credentials
        await jira_service.store_credentials(
            user_id=user_id,
            access_token=token_data['access_token'],
            refresh_token=token_data['refresh_token'],
            cloud_id=site['id'],
            site_url=site['url'],
            site_name=site['name'],
            expires_in=token_data['expires_in']
        )
        
        # Clean up state
        del oauth_states[state]
        
        logger.info(f"Jira connected successfully for user {user_id}: {site['name']}")
        
        # Return JSON response like GitHub OAuth
        return {
            "success": True,
            "site_name": site['name'],
            "site_url": site['url'],
            "cloud_id": site['id']
        }
        
    except Exception as e:
        logger.error(f"Jira OAuth failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/status", response_model=JiraConnectionStatus)
async def get_jira_status(current_user: dict = Depends(get_current_user)):
    """Check if user has connected Jira"""
    user_id = current_user['id']
    credentials = await jira_service.get_credentials(user_id)
    
    if not credentials:
        return JiraConnectionStatus(
            connected=False,
            site_url=None,
            site_name=None,
            expires_at=None
        )
    
    return JiraConnectionStatus(
        connected=True,
        site_url=credentials['site_url'],
        site_name=credentials['site_name'],
        expires_at=credentials['expires_at']
    )


@router.delete("/disconnect")
async def disconnect_jira(current_user: dict = Depends(get_current_user)):
    """Disconnect Jira integration for user"""
    user_id = current_user['id']
    try:
        await jira_service.delete_credentials(user_id)
        logger.info(f"Jira disconnected for user {user_id}")
        return {"message": "Jira disconnected successfully"}
    except Exception as e:
        logger.error(f"Failed to disconnect Jira: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tickets", response_model=JiraTicketResponse)
async def create_jira_ticket(
    ticket_data: JiraTicketCreate,
    case_id: Optional[str] = None,
    user_id: str = Depends(get_current_user)
):
    """
    Create Jira ticket from a compliance violation
    
    - **violation_id**: ID of the compliance violation
    - **project_key**: Jira project key (e.g., "COMP")
    - **issue_type**: Bug, Task, Story, etc.
    - **priority**: Blocker, Critical, Major, Minor, Trivial
    - **assignee**: Jira account ID (optional)
    """
    try:
        ticket = await jira_service.create_ticket_from_violation(
            user_id=user_id,
            violation_id=ticket_data.violation_id,
            case_id=case_id or "unknown",
            project_key=ticket_data.project_key,
            issue_type=ticket_data.issue_type,
            priority=ticket_data.priority,
            assignee=ticket_data.assignee
        )
        
        return ticket
        
    except Exception as e:
        logger.error(f"Failed to create Jira ticket: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tickets/{ticket_id}/sync")
async def sync_jira_ticket(
    ticket_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Sync Jira ticket status back to our database"""
    user_id = current_user['id']
    try:
        result = await jira_service.sync_ticket_status(
            user_id=user_id,
            ticket_id=ticket_id
        )
        
        return {
            "ticket_id": ticket_id,
            "status": result["status"],
            "assignee": result["assignee"],
            "synced_at": "now"
        }
        
    except Exception as e:
        logger.error(f"Failed to sync ticket: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tickets")
async def get_user_jira_tickets(
    case_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all Jira tickets for current user, optionally filtered by case"""
    user_id = current_user['id']
    tickets = await jira_service.get_user_tickets(
        user_id=user_id,
        case_id=case_id
    )
    
    return {"tickets": tickets, "count": len(tickets)}


@router.post("/tickets/bulk-create", response_model=SuccessResponse)
async def bulk_create_tickets(
    case_id: str,
    project_key: str,
    issue_type: str = "Bug",
    priority: str = "Medium",
    current_user: dict = Depends(get_current_user)
):
    """Create Jira tickets for all approved violations in a case"""
    user_id = current_user['id']
    from app.database import db
    
    # Get all violations for case that need tickets
    async with db.acquire() as conn:
        violations = await conn.fetch("""
            SELECT v.violation_id, v.explanation, v.severity 
            FROM violations v
            LEFT JOIN jira_tickets jt ON v.violation_id = jt.violation_id
            WHERE v.scan_id IN (
                SELECT scan_id FROM compliance_scans WHERE scan_id::text = $1
            )
            AND v.status = 'approved'
            AND jt.id IS NULL
        """, case_id)
    
    created_tickets = []
    
    for violation in violations:
        try:
            ticket = await jira_service.create_ticket_from_violation(
                user_id=user_id,
                violation_id=str(violation['violation_id']),
                case_id=case_id,
                project_key=project_key,
                issue_type=issue_type,
                priority=priority
            )
            created_tickets.append(ticket.dict())
        except Exception as e:
            logger.error(f"Failed to create ticket for {violation['violation_id']}: {str(e)}")
            continue
    
    return SuccessResponse(
        message=f"Created {len(created_tickets)} Jira tickets",
        data={
            "case_id": case_id,
            "tickets_created": len(created_tickets),
            "tickets": created_tickets
        }
    )
