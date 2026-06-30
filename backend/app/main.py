from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.core.config import settings
from app.core.database import engine, Base, async_session_factory
from app.core.security import hash_password
from app.models import User, Role, Client, Service, ClientService, Payment, PaymentProof, AuditLog
from app.routers import auth, users, clients, services, payments, reports


async def init_db():
    """Create tables and seed default data."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        # Create default roles if not exist
        result = await session.execute(select(Role).where(Role.name == "Administrador"))
        admin_role = result.scalar_one_or_none()
        if not admin_role:
            admin_role = Role(
                name="Administrador",
                description="Full access to all features",
                permissions={"all": True},
            )
            session.add(admin_role)
            standard_role = Role(
                name="Usuario Estandar",
                description="Read-only access with reports",
                permissions={"read": True, "reports": True},
            )
            session.add(standard_role)
            await session.flush()

        # Create default admin user if not exist
        result = await session.execute(
            select(User).where(User.email == settings.DEFAULT_ADMIN_EMAIL)
        )
        admin_user = result.scalar_one_or_none()
        if not admin_user:
            result = await session.execute(
                select(Role).where(Role.name == "Administrador")
            )
            admin_role = result.scalar_one_or_none()
            admin_user = User(
                email=settings.DEFAULT_ADMIN_EMAIL,
                hashed_password=hash_password(settings.DEFAULT_ADMIN_PASSWORD),
                full_name=settings.DEFAULT_ADMIN_NAME,
                role_id=admin_role.id,
            )
            session.add(admin_user)

        await session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(clients.router, prefix="/api")
app.include_router(services.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(reports.router, prefix="/api")


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME}
