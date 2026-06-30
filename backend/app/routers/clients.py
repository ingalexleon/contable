from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Optional

from app.core.database import get_db
from app.models.client import Client, ClientType
from app.models.user import User
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse
from app.dependencies import get_current_user, require_admin
from app.middleware.audit import log_audit

router = APIRouter(prefix="/clients", tags=["clients"])


def _get_client_ip(request: Request) -> str:
    """Extract client IP from request, considering forwarded headers."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.get("/", response_model=List[ClientResponse])
async def list_clients(
    client_type: Optional[ClientType] = None,
    search: Optional[str] = None,
    include_inactive: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Client)
    if not include_inactive:
        query = query.where(Client.is_active == True)
    if client_type:
        query = query.where(Client.client_type == client_type)
    if search:
        query = query.where(
            or_(
                Client.business_name.ilike(f"%{search}%"),
                Client.rfc.ilike(f"%{search}%"),
            )
        )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.post("/", response_model=ClientResponse)
async def create_client(
    data: ClientCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    client = Client(
        **data.model_dump(),
        created_by=admin.id,
    )
    db.add(client)
    await db.flush()
    await db.refresh(client)

    await log_audit(
        db, admin.id, "create", "client", client.id,
        new_values=data.model_dump(),
        ip_address=_get_client_ip(request),
    )
    return client


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: int,
    data: ClientUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    old_values = {
        "business_name": client.business_name,
        "contact_name": client.contact_name,
        "email": client.email,
    }
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(client, key, value)
    await db.flush()
    await db.refresh(client)

    await log_audit(
        db, admin.id, "update", "client", client.id,
        old_values=old_values,
        new_values=update_data,
        ip_address=_get_client_ip(request),
    )
    return client


@router.delete("/{client_id}", response_model=ClientResponse)
async def delete_client(
    client_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    client.is_active = False  # soft delete
    await db.flush()

    await log_audit(
        db, admin.id, "delete", "client", client.id,
        ip_address=_get_client_ip(request),
    )
    return client
