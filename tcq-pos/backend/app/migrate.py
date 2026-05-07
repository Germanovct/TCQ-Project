import asyncio
from sqlalchemy import text, inspect
from .database import engine

async def migrate():
    print("🚀 Starting database migration...")
    
    def get_columns(conn, table_name):
        inspector = inspect(conn)
        return [c['name'] for c in inspector.get_columns(table_name)]

    async with engine.begin() as conn:
        # Add user_id to tickets if not exists
        try:
            columns = await conn.run_sync(get_columns, "tickets")
            if "user_id" not in columns:
                print("Adding user_id to tickets...")
                await conn.execute(text("ALTER TABLE tickets ADD COLUMN user_id UUID REFERENCES users(id)"))
                print("✅ Column user_id added")
            else:
                print("✅ Column user_id already exists")
        except Exception as e:
            print(f"⚠️ Error in tickets migration: {e}")

        # Add is_active to events if not exists
        try:
            columns = await conn.run_sync(get_columns, "events")
            if "is_active" not in columns:
                print("Adding is_active to events...")
                await conn.execute(text("ALTER TABLE events ADD COLUMN is_active BOOLEAN DEFAULT TRUE"))
                print("✅ Column is_active added")
            else:
                print("✅ Column is_active already exists")
        except Exception as e:
            print(f"⚠️ Error in events migration: {e}")

    print("✅ Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate())
