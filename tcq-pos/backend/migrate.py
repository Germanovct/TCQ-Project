import asyncio
import os
from sqlalchemy import text
from app.database import engine

async def migrate():
    print("🚀 Starting database migration...")
    async with engine.begin() as conn:
        # Add user_id to tickets if not exists
        try:
            print("Checking tickets table...")
            await conn.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id)"))
            print("✅ Column user_id added to tickets table (or already existed)")
        except Exception as e:
            print(f"⚠️ Error adding user_id: {e}")

        # Ensure is_active exists in events
        try:
            print("Checking events table...")
            await conn.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE"))
            print("✅ Column is_active added to events table (or already existed)")
        except Exception as e:
            print(f"⚠️ Error adding is_active: {e}")

    print("✅ Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate())
