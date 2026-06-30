import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_service(client: AsyncClient, admin_token: str):
    """Test creating a service."""
    response = await client.post(
        "/api/services/",
        json={
            "name": "Contabilidad Mensual",
            "description": "Servicio de contabilidad general",
            "default_price": 5000.0,
            "category": "Contabilidad",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Contabilidad Mensual"
    assert data["default_price"] == 5000.0


@pytest.mark.asyncio
async def test_custom_pricing(client: AsyncClient, admin_token: str):
    """Test assigning a service to a client with custom pricing."""
    # Create service
    svc_response = await client.post(
        "/api/services/",
        json={
            "name": "Declaracion Anual",
            "default_price": 3000.0,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    service_id = svc_response.json()["id"]

    # Create client
    cli_response = await client.post(
        "/api/clients/",
        json={
            "business_name": "Cliente Especial",
            "client_type": "Persona Moral",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    client_id = cli_response.json()["id"]

    # Assign with custom price
    response = await client.post(
        "/api/services/client-service",
        json={
            "client_id": client_id,
            "service_id": service_id,
            "custom_price": 2500.0,
            "period": "monthly",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["custom_price"] == 2500.0
    assert data["period"] == "monthly"


@pytest.mark.asyncio
async def test_list_services(client: AsyncClient, admin_token: str):
    """Test listing services."""
    await client.post(
        "/api/services/",
        json={"name": "Test Service", "default_price": 1000.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    response = await client.get(
        "/api/services/",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert len(response.json()) >= 1


@pytest.mark.asyncio
async def test_standard_user_cannot_create_service(client: AsyncClient, standard_token: str):
    """Test that standard users cannot create services."""
    response = await client.post(
        "/api/services/",
        json={"name": "Unauthorized Service", "default_price": 100.0},
        headers={"Authorization": f"Bearer {standard_token}"},
    )
    assert response.status_code == 403
