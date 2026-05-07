"""
TCQ POS — Database Engine & Session Management
Supports both PostgreSQL (production) and SQLite (development).
Auto-detects based on DATABASE_URL.
"""

import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings

settings = get_settings()

# Auto-detect: if no PostgreSQL available, fall back to SQLite
DATABASE_URL = settings.DATABASE_URL

# Check if we should use SQLite fallback
USE_SQLITE = settings.USE_SQLITE

if USE_SQLITE or "postgresql" not in DATABASE_URL:
    # SQLite async requires aiosqlite
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "tcq_pos.db")
    DATABASE_URL = f"sqlite+aiosqlite:///{db_path}"
    print(f"📦 Using SQLite (dev mode): {db_path}")
else:
    # Ensure we use the async driver
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
    elif DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    print(f"🐘 Using PostgreSQL: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else 'configured'}")

# Async engine
engine_kwargs = {
    "echo": settings.DEBUG,
}

# SQLite doesn't support pool_size/max_overflow
if "sqlite" not in DATABASE_URL:
    engine_kwargs["pool_size"] = 20
    engine_kwargs["max_overflow"] = 10
    engine_kwargs["pool_pre_ping"] = True

engine = create_async_engine(DATABASE_URL, **engine_kwargs)

# Session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


async def get_db() -> AsyncSession:
    """
    FastAPI dependency that yields a database session.
    Automatically commits on success, rolls back on error.
    """
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Create all tables. Used for development/testing only."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
