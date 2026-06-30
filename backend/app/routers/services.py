from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.models.service import Service, ClientService
from app.models.user import User
from app.schemas.service import (
    ServiceCreate,
    ServiceUpdate,
    ServiceResponse,
    ClientServiceCreate,
    ClientServiceUpdate,
    ClientServiceResponse,
)
from app.dependencies import get_current_user, require_admin
from app.middleware.audit import log_audit, get_client_ip

router = APIRouter(prefix="/services", tags=["services"])


@router.get("/", response_model=List[ServiceResponse])
async def list_services(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Service).where(Service.is_active == True))
    return result.scalars().all()


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service


@router.post("/", response_model=ServiceResponse)
async def create_service(
    data: ServiceCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    service = Service(**data.model_dump())
    db.add(service)
    await db.flush()
    await db.refresh(service)

    await log_audit(
        db, admin.id, "create", "service", service.id,
        new_values=data.model_dump(),
        ip_address=get_client_ip(request),
    )
    return service


@router.put("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: int,
    data: ServiceUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(service, key, value)
    await db.flush()
    await db.refresh(service)

    await log_audit(
        db, admin.id, "update", "service", service.id,
        new_values=update_data,
        ip_address=get_client_ip(request),
    )
    return service


@router.delete("/{service_id}", response_model=ServiceResponse)
async def delete_service(
    service_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    service.is_active = False
    await db.flush()

    await log_audit(
        db, admin.id, "delete", "service", service.id,
        ip_address=get_client_ip(request),
    )
    return service


# Client-Service assignments (custom pricing)
@router.get("/client/{client_id}", response_model=List[ClientServiceResponse])
async def list_client_services(
    client_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ClientService).where(ClientService.client_id == client_id)
    )
    return result.scalars().all()


@router.post("/client-service", response_model=ClientServiceResponse)
async def create_client_service(
    data: ClientServiceCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    cs = ClientService(**data.model_dump())
    db.add(cs)
    await db.flush()
    await db.refresh(cs)

    await log_audit(
        db, admin.id, "create", "client_service", cs.id,
        new_values=data.model_dump(mode="json"),
        ip_address=get_client_ip(request),
    )
    return cs


@router.put("/client-service/{cs_id}", response_model=ClientServiceResponse)
async def update_client_service(
    cs_id: int,
    data: ClientServiceUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(ClientService).where(ClientService.id == cs_id))
    cs = result.scalar_one_or_none()
    if not cs:
        raise HTTPException(status_code=404, detail="Client service assignment not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(cs, key, value)
    await db.flush()
    await db.refresh(cs)

    await log_audit(
        db, admin.id, "update", "client_service", cs.id,
        new_values=update_data,
        ip_address=get_client_ip(request),
    )
    return cs
