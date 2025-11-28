# Jira OAuth 2.0 Integration Setup Guide

## Overview
The compliance system now supports per-user Jira OAuth 2.0 authentication, allowing each user to connect their own Jira workspace and automatically create tickets for compliance violations.

## Prerequisites
1. Access to Atlassian Developer Console: https://developer.atlassian.com/console/myapps/
2. Backend server running with database migrations applied
3. User authenticated in the compliance system

## Step 1: Create Jira OAuth 2.0 App

1. Go to https://developer.atlassian.com/console/myapps/
2. Click **Create** → **OAuth 2.0 integration**
3. Fill in the app details:
   - **Name**: Compliance Engine (or any name)
   - **Description**: AI-powered compliance automation

4. Configure OAuth 2.0 settings:
   - **Callback URL**: `http://localhost:8000/api/jira/callback` (for local dev)
   - For production: `https://yourdomain.com/api/jira/callback`

5. Set Permissions (Scopes):
   - `read:jira-work` - Read Jira project and issue data
   - `write:jira-work` - Create and edit issues
   - `read:jira-user` - Read user information
   - `offline_access` - Refresh tokens

6. Save and note down:
   - **Client ID** (e.g., `abc123xyz`)
   - **Client Secret** (e.g., `secret_key_here`)

## Step 2: Configure Backend Environment

Add to `backend/.env`:

```bash
# Jira OAuth 2.0
JIRA_CLIENT_ID=your_client_id_from_step_1
JIRA_CLIENT_SECRET=your_client_secret_from_step_1
JIRA_REDIRECT_URI=http://localhost:8000/api/jira/callback
```

## Step 3: Database Setup

The migration has been applied and created:
- ✅ `jira_credentials` - Stores per-user OAuth tokens
- ✅ `jira_tickets` - Maps violations to Jira tickets

## Step 4: OAuth Flow (User Perspective)

### Initiate OAuth Connection
```bash
GET /api/jira/connect?user_id={user_id}
```

Response:
```json
{
  "authorization_url": "https://auth.atlassian.com/authorize?..."
}
```

User clicks the URL and:
1. Logs into Jira (if not already)
2. Selects their Jira site
3. Approves the app permissions
4. Gets redirected to callback URL

### Callback Handling
Backend automatically:
1. Exchanges authorization code for access token
2. Stores credentials in `jira_credentials` table
3. Stores cloud_id, site_url, refresh_token
4. Sets token expiration time

### Check Connection Status
```bash
GET /api/jira/status?user_id={user_id}
```

Response:
```json
{
  "connected": true,
  "site_url": "https://your-site.atlassian.net",
  "site_name": "Your Site",
  "expires_at": "2025-12-28T23:47:00Z"
}
```

## Step 5: Create Tickets from Violations

### Single Ticket Creation
```bash
POST /api/jira/tickets
Content-Type: application/json

{
  "user_id": "user123",
  "violation_id": "uuid-of-violation",
  "project_key": "COMP",
  "issue_type": "Bug",
  "priority": "High",
  "assignee": "john.doe@company.com"
}
```

Response:
```json
{
  "id": "uuid",
  "jira_ticket_id": "10001",
  "jira_ticket_key": "COMP-123",
  "jira_ticket_url": "https://your-site.atlassian.net/browse/COMP-123",
  "status": "To Do"
}
```

### Bulk Ticket Creation
```bash
POST /api/jira/tickets/bulk-create
Content-Type: application/json

{
  "user_id": "user123",
  "case_id": "audit-case-uuid",
  "project_key": "COMP",
  "issue_type": "Bug",
  "priority": "High"
}
```

Creates tickets for all violations in the audit case.

## Step 6: Sync Ticket Status

```bash
POST /api/jira/tickets/{ticket_id}/sync
```

Fetches latest status from Jira and updates local database.

## Architecture Details

### OAuth 2.0 Flow (3LO)
```
User → GET /jira/connect → Authorization URL
User → Approves in Jira → Redirect to /jira/callback?code=xxx
Backend → Exchange code for tokens → Store credentials
Backend → Auto-refresh expired tokens
```

### Token Management
- **Access Token**: Valid for 1 hour
- **Refresh Token**: Used to get new access token
- **Auto-refresh**: Service automatically refreshes expired tokens
- **Storage**: Encrypted in database per-user

### Jira API Integration
- **Base URL**: `https://api.atlassian.com`
- **Issue Creation**: `POST /rest/api/3/issue`
- **Issue Retrieval**: `GET /rest/api/3/issue/{issueIdOrKey}`
- **Issue Transition**: `POST /rest/api/3/issue/{issueIdOrKey}/transitions`

## API Endpoints

### OAuth Endpoints
- `GET /api/jira/connect` - Get OAuth authorization URL
- `GET /api/jira/callback` - OAuth callback handler
- `GET /api/jira/status` - Check connection status
- `DELETE /api/jira/disconnect` - Revoke credentials

### Ticket Management
- `POST /api/jira/tickets` - Create single ticket
- `POST /api/jira/tickets/bulk-create` - Create multiple tickets
- `GET /api/jira/tickets` - List tickets for user/case
- `POST /api/jira/tickets/{id}/sync` - Sync ticket status

## Security Features

1. **Per-User Authentication**: Each user connects their own Jira
2. **Token Encryption**: OAuth tokens stored securely
3. **Auto-Refresh**: Expired tokens automatically refreshed
4. **Scoped Access**: Minimal required permissions
5. **Audit Trail**: All ticket operations logged

## Testing

### 1. Test OAuth Flow
```bash
# Get authorization URL
curl http://localhost:8000/api/jira/connect?user_id=test_user

# Open returned URL in browser
# Complete OAuth flow
# Check status
curl http://localhost:8000/api/jira/status?user_id=test_user
```

### 2. Test Ticket Creation
```bash
# Ensure you have a violation in database
# Create ticket
curl -X POST http://localhost:8000/api/jira/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "violation_id": "your-violation-uuid",
    "project_key": "COMP",
    "issue_type": "Bug",
    "priority": "High"
  }'
```

## Troubleshooting

### "Invalid client credentials"
- Check `JIRA_CLIENT_ID` and `JIRA_CLIENT_SECRET` in .env
- Verify they match your OAuth app in Atlassian Console

### "Redirect URI mismatch"
- Ensure `JIRA_REDIRECT_URI` matches exactly in:
  - `.env` file
  - Atlassian OAuth app settings
  - Both must use same protocol (http/https)

### "Token expired"
- Service auto-refreshes tokens
- If manual refresh needed: reconnect user via `/jira/connect`

### "Project not found"
- Verify `project_key` exists in user's Jira site
- User must have permission to create issues in project

## Next Steps

1. **Frontend Integration**: Add UI for OAuth connection
2. **Webhook Sync**: Auto-sync ticket status from Jira webhooks
3. **Custom Fields**: Support Jira custom field mapping
4. **Bulk Operations**: Assign multiple tickets at once
5. **Analytics**: Track ticket resolution metrics

## Resources

- [Atlassian OAuth 2.0 Guide](https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/)
- [Jira REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [OAuth 2.0 Scopes](https://developer.atlassian.com/cloud/jira/platform/scopes-for-oauth-2-3lo-and-forge-apps/)
