from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from app.core.database import get_db
from app.models.client import Client
from app.models.payment import Payment, PaymentStatus
from app.models.service import ClientService, Service
from app.models.user import User
from app.dependencies import get_current_user
from app.services.calculations import calculate_client_billing
from app.services.export import export_clients_to_excel, export_payments_to_excel

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/client/{client_id}")
async def client_report(
    client_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Individual client report with billing summary."""
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        return {"error": "Client not found"}

    billing = await calculate_client_billing(db, client_id)

    payments_result = await db.execute(
        select(Payment).where(Payment.client_id == client_id)
    )
    payments = payments_result.scalars().all()

    total_paid = sum(p.amount for p in payments if p.status == PaymentStatus.PAID)
    total_pending = sum(p.amount for p in payments if p.status == PaymentStatus.PENDING)

    return {
        "client": {
            "id": client.id,
            "business_name": client.business_name,
            "rfc": client.rfc,
            "client_type": client.client_type.value if client.client_type else None,
        },
        "billing": billing,
        "payments_summary": {
            "total_paid": total_paid,
            "total_pending": total_pending,
            "total_payments": len(payments),
        },
    }


@router.get("/general")
async def general_report(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """General report with aggregate statistics."""
    clients_count = await db.execute(
        select(func.count(Client.id)).where(Client.is_active == True)
    )
    total_clients = clients_count.scalar() or 0

    payments_result = await db.execute(select(Payment))
    payments = payments_result.scalars().all()

    total_revenue = sum(p.amount for p in payments if p.status == PaymentStatus.PAID)
    total_pending = sum(p.amount for p in payments if p.status == PaymentStatus.PENDING)
    total_overdue = sum(p.amount for p in payments if p.status == PaymentStatus.OVERDUE)

    return {
        "total_clients": total_clients,
        "total_revenue": total_revenue,
        "total_pending": total_pending,
        "total_overdue": total_overdue,
        "total_payments": len(payments),
    }


@router.get("/dashboard")
async def dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Dashboard statistics."""
    clients_count = await db.execute(
        select(func.count(Client.id)).where(Client.is_active == True)
    )
    active_clients = clients_count.scalar() or 0

    services_count = await db.execute(
        select(func.count(Service.id)).where(Service.is_active == True)
    )
    active_services = services_count.scalar() or 0

    payments_result = await db.execute(select(Payment))
    payments = payments_result.scalars().all()

    paid_count = sum(1 for p in payments if p.status == PaymentStatus.PAID)
    pending_count = sum(1 for p in payments if p.status == PaymentStatus.PENDING)
    overdue_count = sum(1 for p in payments if p.status == PaymentStatus.OVERDUE)

    return {
        "active_clients": active_clients,
        "active_services": active_services,
        "payments": {
            "paid": paid_count,
            "pending": pending_count,
            "overdue": overdue_count,
            "total": len(payments),
        },
    }


@router.get("/export/excel")
async def export_excel(
    report_type: str = "clients",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export data to Excel format."""
    if report_type == "payments":
        output = await export_payments_to_excel(db)
        filename = "pagos_reporte.xlsx"
    else:
        output = await export_clients_to_excel(db)
        filename = "clientes_reporte.xlsx"

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
