import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
from app.models.user import User

DATABASE_URL = "postgresql+asyncpg://postgres.eofsbuuiejouxuyynutn:2OCozXkdwb1hBVxv@aws-1-us-west-2.pooler.supabase.com:5432/postgres"

async def test():
    engine = create_async_engine(DATABASE_URL)
    Session = async_sessionmaker(engine)
    async with Session() as db:
        result = await db.execute(select(User))
        for u in result.scalars().all():
            print(u.email, u.role)

asyncio.run(test())
