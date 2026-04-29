import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
from app.models.user import User
from app.utils.security import hash_password

DATABASE_URL = "postgresql+asyncpg://postgres.eofsbuuiejouxuyynutn:2OCozXkdwb1hBVxv@aws-1-us-west-2.pooler.supabase.com:5432/postgres"

async def test():
    engine = create_async_engine(DATABASE_URL)
    Session = async_sessionmaker(engine)
    async with Session() as db:
        result = await db.execute(select(User))
        for u in result.scalars().all():
            if u.email == "admin@tcq.club":
                u.hashed_password = hash_password("Admin123")
                print("Updated admin password to Admin123")
            if u.email == "barman@tcq.club":
                u.hashed_password = hash_password("Barman123")
                print("Updated barman password to Barman123")
        await db.commit()

asyncio.run(test())
