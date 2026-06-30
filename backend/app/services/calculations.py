from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any

from app.models.service import ClientService, Service


async def calculate_client_billing(
    db: AsyncSession, client_id: int, period: str = "monthly"
) -> Dict[str, Any]:
    """
    Calculate total billing for a client based on their active services.
    Uses custom_price if set, otherwise falls back to default_price.
    """
    query = (
        select(ClientService, Service)
        .join(Service, ClientService.service_id == Service.id)
        .where(
            ClientService.client_id == client_id,
            ClientService.is_active == True,
            ClientService.period == period,
        )
    )
    result = await db.execute(query)
    rows = result.all()

    services_detail: List[Dict[str, Any]] = []
    total = 0.0

    for client_service, service in rows:
        price = client_service.custom_price if client_service.custom_price is not None else service.default_price
        total += price
        services_detail.append({
            "service_id": service.id,
            "service_name": service.name,
            "price": price,
            "is_custom_price": client_service.custom_price is not None,
            "period": client_service.period,
        })

    return {
        "client_id": client_id,
        "period": period,
        "total": total,
        "services": services_detail,
    }
