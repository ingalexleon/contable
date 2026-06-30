"""
Database initialization script.

Creates default roles and the initial admin user when
the application starts for the first time.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import engine, Base, async_session_factory
from app.core.security import hash_password
from app.models import User, Role


async def init_db() -> None:
    """Create tables and seed default data."""
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        await _seed_roles(session)
        await _seed_admin_user(session)
        await session.commit()


async def _seed_roles(session: AsyncSession) -> None:
    """Create default roles if they don't exist."""
    result = await session.execute(select(Role).where(Role.name == "Administrador"))
    if result.scalar_one_or_none() is not None:
        return

    admin_role = Role(
        name="Administrador",
        description="Acceso completo a todas las funciones",
        permissions={"all": True},
    )
    session.add(admin_role)

    standard_role = Role(
        name="Usuario Estandar",
        description="Acceso de lectura y reportes",
        permissions={"read": True, "reports": True},
    )
    session.add(standard_role)

    await session.flush()


async def _seed_admin_user(session: AsyncSession) -> None:
    """Create default admin user if it doesn't exist."""
    result = await session.execute(
        select(User).where(User.email == settings.DEFAULT_ADMIN_EMAIL)
    )
    if result.scalar_one_or_none() is not None:
        return

    result = await session.execute(
        select(Role).where(Role.name == "Administrador")
    )
    admin_role = result.scalar_one_or_none()
    if admin_role is None:
        return

    admin_user = User(
        email=settings.DEFAULT_ADMIN_EMAIL,
        hashed_password=hash_password(settings.DEFAULT_ADMIN_PASSWORD),
        full_name=settings.DEFAULT_ADMIN_NAME,
        role_id=admin_role.id,
    )
    session.add(admin_user)
