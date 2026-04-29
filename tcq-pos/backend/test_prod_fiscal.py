import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.api.orders import generate_fiscal_ticket
import uuid

DATABASE_URL = "postgresql+asyncpg://postgres.eofsbuuiejouxuyynutn:2OCozXkdwb1hBVxv@aws-1-us-west-2.pooler.supabase.com:5432/postgres"

async def test():
    engine = create_async_engine(DATABASE_URL)
    Session = async_sessionmaker(engine)
    async with Session() as db:
        try:
            res = await generate_fiscal_ticket(uuid.UUID("3bbbc4da-61a4-4a4b-9933-e13a86c56939"), db)
            print("Fiscal result:", res)
        except Exception as e:
            print("Fiscal error:", type(e).__name__, str(e))

asyncio.run(test())
