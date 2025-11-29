"""
Apply migration 009 - Complete Auth System
"""
import asyncio
import asyncpg
from pathlib import Path

from app.config import get_settings

async def apply_migration():
    settings = get_settings()
    
    # Parse database URL
    db_url = settings.database_url
    
    print("Connecting to database...")
    conn = await asyncpg.connect(db_url)
    
    try:
        # Read migration file
        migration_path = Path(__file__).parent / "migrations" / "009_complete_auth_system.sql"
        with open(migration_path, 'r') as f:
            migration_sql = f.read()
        
        print("Applying migration 009_complete_auth_system.sql...")
        await conn.execute(migration_sql)
        
        print("✅ Migration applied successfully!")
        
        # Verify tables exist
        tables = await conn.fetch("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'sessions', 'oauth_connections')
            ORDER BY table_name
        """)
        
        print(f"Verified tables: {[t['table_name'] for t in tables]}")
        
    finally:
        await conn.close()
        print("Database connection closed")

if __name__ == "__main__":
    asyncio.run(apply_migration())
