import io
from typing import List, Dict, Any

from openpyxl import Workbook
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.client import Client
from app.models.payment import Payment
from app.models.service import Service


async def export_clients_to_excel(db: AsyncSession) -> io.BytesIO:
    """Export all active clients to an Excel file."""
    result = await db.execute(select(Client).where(Client.is_active == True))
    clients = result.scalars().all()

    wb = Workbook()
    ws = wb.active
    ws.title = "Clientes"

    headers = [
        "ID", "Razon Social", "Contacto", "Email",
        "Telefono", "RFC", "Tipo", "Direccion", "Fecha Registro"
    ]
    ws.append(headers)

    for client in clients:
        ws.append([
            client.id,
            client.business_name,
            client.contact_name,
            client.email,
            client.phone,
            client.rfc,
            client.client_type.value if client.client_type else "",
            client.address,
            client.created_at.strftime("%Y-%m-%d") if client.created_at else "",
        ])

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output


async def export_payments_to_excel(db: AsyncSession) -> io.BytesIO:
    """Export all payments to an Excel file."""
    result = await db.execute(select(Payment))
    payments = result.scalars().all()

    wb = Workbook()
    ws = wb.active
    ws.title = "Pagos"

    headers = [
        "ID", "Cliente ID", "Monto", "Fecha Pago",
        "Periodo Inicio", "Periodo Fin", "Estado", "Notas"
    ]
    ws.append(headers)

    for payment in payments:
        ws.append([
            payment.id,
            payment.client_id,
            payment.amount,
            str(payment.payment_date) if payment.payment_date else "",
            str(payment.period_start) if payment.period_start else "",
            str(payment.period_end) if payment.period_end else "",
            payment.status.value if payment.status else "",
            payment.notes,
        ])

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output


async def export_general_report_excel(
    db: AsyncSession,
    clients_data: List[Dict[str, Any]],
    payments_data: List[Dict[str, Any]],
) -> io.BytesIO:
    """Export a general report with clients and payments sheets."""
    wb = Workbook()

    # Clients sheet
    ws_clients = wb.active
    ws_clients.title = "Clientes"
    if clients_data:
        ws_clients.append(list(clients_data[0].keys()))
        for row in clients_data:
            ws_clients.append(list(row.values()))

    # Payments sheet
    ws_payments = wb.create_sheet("Pagos")
    if payments_data:
        ws_payments.append(list(payments_data[0].keys()))
        for row in payments_data:
            ws_payments.append(list(row.values()))

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output
