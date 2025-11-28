"""Apply migration 008 for Jira integration."""
import asyncio
from pathlib import Path
from app.database import db
from loguru import logger

async def apply_migration():
    """Apply migration 008."""
    migration_file = Path("migrations/008_jira_integration.sql")
    
    if not migration_file.exists():
        logger.error(f"Migration file not found: {migration_file}")
        return
    
    await db.connect()
    
    try:
        sql = migration_file.read_text(encoding="utf-8")
        logger.info(f"Applying {migration_file.name}...")
        await db.execute(sql)
        logger.info(f"✅ Successfully applied {migration_file.name}")
        
        # Verify tables were created
        jira_creds_exists = await db.fetchval(
            "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jira_credentials')"
        )
        jira_tickets_exists = await db.fetchval(
            "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jira_tickets')"
        )
        
        logger.info(f"jira_credentials table exists: {jira_creds_exists}")
        logger.info(f"jira_tickets table exists: {jira_tickets_exists}")
        
    except Exception as e:
        logger.error(f"❌ Failed to apply {migration_file.name}: {e}")
    finally:
        await db.disconnect()

if __name__ == "__main__":
    asyncio.run(apply_migration())
