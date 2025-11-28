"""Check if Jira tables exist in database."""
import asyncio
from app.database import db

async def check_tables():
    await db.connect()
    
    jira_creds_exists = await db.fetchval(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jira_credentials')"
    )
    
    jira_tickets_exists = await db.fetchval(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jira_tickets')"
    )
    
    print(f"jira_credentials table exists: {jira_creds_exists}")
    print(f"jira_tickets table exists: {jira_tickets_exists}")
    
    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(check_tables())
