import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres.eofsbuuiejouxuyynutn:2OCozXkdwb1hBVxv@aws-1-us-west-2.pooler.supabase.com:5432/postgres"

async def test():
    engine = create_async_engine(DATABASE_URL)
    async with engine.connect() as conn:
        try:
            await conn.execute(text("ALTER TABLE transactions ALTER COLUMN operator_id TYPE CHAR(36);"))
            await conn.commit()
            print("Changed operator_id to CHAR(36)")
        except Exception as e:
            await conn.rollback()
            print("operator_id error:", str(e))

asyncio.run(test())
