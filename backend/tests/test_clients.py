import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_client(client: AsyncClient, admin_token: str):
    """Test creating a client as admin."""
    response = await client.post(
        "/api/clients/",
        json={
            "business_name": "Empresa Test SA",
            "contact_name": "Juan Perez",
            "email": "juan@empresa.com",
            "phone": "5551234567",
            "rfc": "EMP123456789",
            "client_type": "Persona Moral",
            "address": "Calle Test 123",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["business_name"] == "Empresa Test SA"
    assert data["rfc"] == "EMP123456789"
    assert data["client_type"] == "Persona Moral"
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_standard_user_cannot_create_client(client: AsyncClient, standard_token: str):
    """Test that standard users cannot create clients."""
    response = await client.post(
        "/api/clients/",
        json={
            "business_name": "Should Fail",
            "client_type": "Persona Fisica",
        },
        headers={"Authorization": f"Bearer {standard_token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_clients(client: AsyncClient, admin_token: str):
    """Test listing clients."""
    # Create a client first
    await client.post(
        "/api/clients/",
        json={
            "business_name": "Client A",
            "client_type": "Persona Fisica",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    response = await client.get(
        "/api/clients/",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_search_clients(client: AsyncClient, admin_token: str):
    """Test searching clients by name."""
    await client.post(
        "/api/clients/",
        json={
            "business_name": "Empresa Unica",
            "rfc": "UNI987654321",
            "client_type": "Persona Moral",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    response = await client.get(
        "/api/clients/?search=Unica",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert any("Unica" in c["business_name"] for c in data)


@pytest.mark.asyncio
async def test_soft_delete_client(client: AsyncClient, admin_token: str):
    """Test soft deleting a client."""
    # Create
    response = await client.post(
        "/api/clients/",
        json={
            "business_name": "To Delete",
            "client_type": "Regimen Simplificado",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    client_id = response.json()["id"]

    # Delete (soft)
    response = await client.delete(
        f"/api/clients/{client_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is False

    # Should not appear in default listing
    response = await client.get(
        "/api/clients/",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    data = response.json()
    active_ids = [c["id"] for c in data]
    assert client_id not in active_ids


@pytest.mark.asyncio
async def test_update_client(client: AsyncClient, admin_token: str):
    """Test updating a client."""
    # Create
    response = await client.post(
        "/api/clients/",
        json={
            "business_name": "Original Name",
            "client_type": "Persona Fisica",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    client_id = response.json()["id"]

    # Update
    response = await client.put(
        f"/api/clients/{client_id}",
        json={"business_name": "Updated Name"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["business_name"] == "Updated Name"
