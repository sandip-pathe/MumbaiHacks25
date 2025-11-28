"""
Jira OAuth 2.0 Client
Handles authentication and API calls to Atlassian Jira
"""
import httpx
from typing import Optional, Dict, Any
from loguru import logger

from app.config import get_settings

settings = get_settings()


class JiraOAuthClient:
    """Handles Jira OAuth 2.0 (3LO) authentication and API calls"""
    
    JIRA_AUTH_URL = "https://auth.atlassian.com/authorize"
    JIRA_TOKEN_URL = "https://auth.atlassian.com/oauth/token"
    JIRA_API_BASE = "https://api.atlassian.com"
    
    def __init__(self):
        self.client_id = getattr(settings, 'jira_client_id', '')
        self.client_secret = getattr(settings, 'jira_client_secret', '')
        self.redirect_uri = getattr(settings, 'jira_redirect_uri', 'http://localhost:8000/api/jira/callback')
        
    def get_authorization_url(self, state: str) -> str:
        """Generate OAuth authorization URL for user to login"""
        params = {
            "audience": "api.atlassian.com",
            "client_id": self.client_id,
            "scope": "read:jira-work write:jira-work read:jira-user offline_access",
            "redirect_uri": self.redirect_uri,
            "state": state,
            "response_type": "code",
            "prompt": "consent"
        }
        
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{self.JIRA_AUTH_URL}?{query_string}"
    
    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.JIRA_TOKEN_URL,
                data={
                    "grant_type": "authorization_code",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "redirect_uri": self.redirect_uri
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Failed to exchange code: {response.text}")
                raise Exception(f"Jira OAuth failed: {response.text}")
            
            return response.json()
    
    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh expired access token"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.JIRA_TOKEN_URL,
                data={
                    "grant_type": "refresh_token",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "refresh_token": refresh_token
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Failed to refresh token: {response.text}")
                raise Exception(f"Token refresh failed: {response.text}")
            
            return response.json()
    
    async def get_accessible_resources(self, access_token: str) -> list:
        """Get list of Jira sites user has access to"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.JIRA_API_BASE}/oauth/token/accessible-resources",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if response.status_code != 200:
                logger.error(f"Failed to get resources: {response.text}")
                raise Exception("Failed to get Jira resources")
            
            return response.json()
    
    async def create_issue(
        self,
        cloud_id: str,
        access_token: str,
        project_key: str,
        summary: str,
        description: str,
        issue_type: str = "Bug",
        priority: str = "Medium",
        assignee: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a Jira issue"""
        
        issue_data = {
            "fields": {
                "project": {"key": project_key},
                "summary": summary,
                "description": {
                    "type": "doc",
                    "version": 1,
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {"type": "text", "text": description}
                            ]
                        }
                    ]
                },
                "issuetype": {"name": issue_type},
                "priority": {"name": priority}
            }
        }
        
        if assignee:
            issue_data["fields"]["assignee"] = {"accountId": assignee}
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.JIRA_API_BASE}/ex/jira/{cloud_id}/rest/api/3/issue",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                },
                json=issue_data
            )
            
            if response.status_code not in [200, 201]:
                logger.error(f"Failed to create issue: {response.text}")
                raise Exception(f"Issue creation failed: {response.text}")
            
            return response.json()
    
    async def get_issue(
        self,
        cloud_id: str,
        access_token: str,
        issue_key: str
    ) -> Dict[str, Any]:
        """Get issue details"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.JIRA_API_BASE}/ex/jira/{cloud_id}/rest/api/3/issue/{issue_key}",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if response.status_code != 200:
                logger.error(f"Failed to get issue: {response.text}")
                raise Exception("Failed to get issue")
            
            return response.json()
    
    async def update_issue_status(
        self,
        cloud_id: str,
        access_token: str,
        issue_key: str,
        transition_id: str
    ):
        """Update issue status via transition"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.JIRA_API_BASE}/ex/jira/{cloud_id}/rest/api/3/issue/{issue_key}/transitions",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                },
                json={"transition": {"id": transition_id}}
            )
            
            if response.status_code not in [200, 204]:
                logger.error(f"Failed to update status: {response.text}")
                raise Exception("Status update failed")


# Global client instance
jira_client = JiraOAuthClient()
