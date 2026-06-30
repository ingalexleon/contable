import pytest
import asyncio
from typing import AsyncGenerator

from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.core.database import Base, get_db
from app.core.security import hash_password
from app.models.role import Role
from app.models.user import User
from app.main import app

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_contable.db"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
test_session_factory = async_sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
async def setup_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with test_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with test_session_factory() as session:
        yield session
        await session.commit()


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def admin_token(db_session: AsyncSession) -> str:
    """Create admin role and user, return JWT token."""
    from app.core.security import create_access_token
    from sqlalchemy import select

    # Check if role exists
    result = await db_session.execute(select(Role).where(Role.name == "Administrador"))
    role = result.scalar_one_or_none()
    if not role:
        role = Role(
            name="Administrador",
            description="Full access",
            permissions={"all": True},
        )
        db_session.add(role)
        await db_session.flush()

    # Check if standard role exists
    result = await db_session.execute(select(Role).where(Role.name == "Usuario Estandar"))
    std_role = result.scalar_one_or_none()
    if not std_role:
        std_role = Role(
            name="Usuario Estandar",
            description="Read only",
            permissions={"read": True},
        )
        db_session.add(std_role)
        await db_session.flush()

    # Check if user exists
    result = await db_session.execute(select(User).where(User.email == "admin@test.com"))
    user = result.scalar_one_or_none()
    if not user:
        user = User(
            email="admin@test.com",
            hashed_password=hash_password("admin123"),
            full_name="Test Admin",
            role_id=role.id,
        )
        db_session.add(user)
        await db_session.flush()

    await db_session.commit()
    return create_access_token(data={"sub": "admin@test.com"})


@pytest.fixture
async def standard_token(db_session: AsyncSession) -> str:
    """Create standard user and return JWT token."""
    from app.core.security import create_access_token
    from sqlalchemy import select

    # Ensure standard role exists
    result = await db_session.execute(select(Role).where(Role.name == "Usuario Estandar"))
    role = result.scalar_one_or_none()
    if not role:
        role = Role(
            name="Usuario Estandar",
            description="Read only",
            permissions={"read": True},
        )
        db_session.add(role)
        await db_session.flush()

    # Create standard user
    result = await db_session.execute(select(User).where(User.email == "user@test.com"))
    user = result.scalar_one_or_none()
    if not user:
        user = User(
            email="user@test.com",
            hashed_password=hash_password("user123"),
            full_name="Test User",
            role_id=role.id,
        )
        db_session.add(user)
        await db_session.flush()

    await db_session.commit()
    return create_access_token(data={"sub": "user@test.com"})
