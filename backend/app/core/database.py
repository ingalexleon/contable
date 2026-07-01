from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


def _get_engine_kwargs():
    """Return engine kwargs appropriate for the configured database."""
    kwargs = {
        "echo": settings.DEBUG,
    }
    url = settings.DATABASE_URL

    if "sqlite" in url:
        # SQLite-specific settings
        kwargs["connect_args"] = {"check_same_thread": False}
    else:
        # PostgreSQL-specific settings
        kwargs["pool_size"] = 5
        kwargs["max_overflow"] = 10
        kwargs["pool_pre_ping"] = True
        kwargs["pool_recycle"] = 300
        kwargs["pool_timeout"] = 30

    return kwargs


engine = create_async_engine(settings.DATABASE_URL, **_get_engine_kwargs())

async_session_factory = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
