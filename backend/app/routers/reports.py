from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from datetime import datetime, date
from collections import defaultdict

from app.core.database import get_db
from app.models.client import Client, ClientType
from app.models.payment import Payment, PaymentStatus
from app.models.service import ClientService, Service
from app.models.user import User
from app.dependencies import get_current_user
from app.services.calculations import calculate_client_billing
from app.services.export import (
    export_clients_to_excel,
    export_payments_to_excel,
    export_services_to_excel,
    export_all_to_excel,
)

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

    # Count active services for this client
    active_services_result = await db.execute(
        select(func.count(ClientService.id)).where(
            ClientService.client_id == client_id,
            ClientService.is_active == True,
        )
    )
    active_services = active_services_result.scalar() or 0

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
        # Flat fields expected by the frontend
        "total_paid": total_paid,
        "total_pending": total_pending,
        "active_services": active_services,
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
    active_clients = clients_count.scalar() or 0

    # Count active services
    active_services_result = await db.execute(
        select(func.count(ClientService.id)).where(ClientService.is_active == True)
    )
    active_services = active_services_result.scalar() or 0

    # Use SQL aggregation for payment totals
    total_revenue_result = await db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0)).where(
            Payment.status == PaymentStatus.PAID
        )
    )
    total_revenue = float(total_revenue_result.scalar() or 0)

    total_pending_result = await db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0)).where(
            Payment.status == PaymentStatus.PENDING
        )
    )
    total_pending = float(total_pending_result.scalar() or 0)

    total_overdue_result = await db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0)).where(
            Payment.status == PaymentStatus.OVERDUE
        )
    )
    total_overdue = float(total_overdue_result.scalar() or 0)

    total_payments_result = await db.execute(
        select(func.count(Payment.id))
    )
    total_payments = total_payments_result.scalar() or 0

    return {
        "total_clients": active_clients,
        "active_clients": active_clients,
        "active_services": active_services,
        "total_revenue": total_revenue,
        "total_pending": total_pending,
        "total_overdue": total_overdue,
        "total_payments": total_payments,
    }


@router.get("/dashboard")
async def dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Dashboard statistics."""
    # Total clients (active)
    clients_count = await db.execute(
        select(func.count(Client.id)).where(Client.is_active == True)
    )
    total_clients = clients_count.scalar() or 0

    # Active services (client-service assignments that are active)
    active_services_result = await db.execute(
        select(func.count(ClientService.id)).where(ClientService.is_active == True)
    )
    active_services = active_services_result.scalar() or 0

    # Monthly revenue (sum of all paid payments) via SQL aggregation
    revenue_result = await db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0)).where(
            Payment.status == PaymentStatus.PAID
        )
    )
    monthly_revenue = float(revenue_result.scalar() or 0)

    # Pending payments count via SQL aggregation
    pending_result = await db.execute(
        select(func.count(Payment.id)).where(
            Payment.status == PaymentStatus.PENDING
        )
    )
    pending_payments = pending_result.scalar() or 0

    # Paid count and overdue count via SQL
    paid_count_result = await db.execute(
        select(func.count(Payment.id)).where(
            Payment.status == PaymentStatus.PAID
        )
    )
    paid_count = paid_count_result.scalar() or 0

    overdue_count_result = await db.execute(
        select(func.count(Payment.id)).where(
            Payment.status == PaymentStatus.OVERDUE
        )
    )
    overdue_count = overdue_count_result.scalar() or 0

    total_payments_result = await db.execute(
        select(func.count(Payment.id))
    )
    total_payments_count = total_payments_result.scalar() or 0

    # Monthly revenue chart - aggregate by month using SQL
    # We use payment_date for grouping paid payments
    monthly_chart_result = await db.execute(
        select(Payment.payment_date, Payment.amount).where(
            Payment.status == PaymentStatus.PAID,
            Payment.payment_date.isnot(None),
        )
    )
    month_names = [
        "", "Ene", "Feb", "Mar", "Abr", "May", "Jun",
        "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    ]
    monthly_data = defaultdict(float)
    for row in monthly_chart_result.all():
        payment_date, amount = row
        if payment_date:
            key = f"{month_names[payment_date.month]} {payment_date.year}"
            monthly_data[key] += amount

    monthly_revenue_chart = [
        {"month": month, "revenue": revenue}
        for month, revenue in monthly_data.items()
    ]

    # Client type distribution
    type_result = await db.execute(
        select(Client.client_type, func.count(Client.id))
        .where(Client.is_active == True)
        .group_by(Client.client_type)
    )
    client_type_distribution = [
        {"type": row[0].value if row[0] else "Sin tipo", "count": row[1]}
        for row in type_result.all()
    ]

    # Top services
    top_services_result = await db.execute(
        select(Service.name, func.count(ClientService.id))
        .join(ClientService, ClientService.service_id == Service.id)
        .where(ClientService.is_active == True)
        .group_by(Service.name)
        .order_by(func.count(ClientService.id).desc())
        .limit(10)
    )
    top_services = [
        {"name": row[0], "count": row[1]}
        for row in top_services_result.all()
    ]

    return {
        "total_clients": total_clients,
        "active_clients": total_clients,
        "active_services": active_services,
        "monthly_revenue": monthly_revenue,
        "pending_payments": pending_payments,
        "monthly_revenue_chart": monthly_revenue_chart,
        "client_type_distribution": client_type_distribution,
        "top_services": top_services,
        # Keep backward-compatible keys
        "payments": {
            "paid": paid_count,
            "pending": pending_payments,
            "overdue": overdue_count,
            "total": total_payments_count,
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
    elif report_type == "services":
        output = await export_services_to_excel(db)
        filename = "servicios_reporte.xlsx"
    elif report_type == "all":
        output = await export_all_to_excel(db)
        filename = "reporte_general.xlsx"
    else:
        output = await export_clients_to_excel(db)
        filename = "clientes_reporte.xlsx"

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
