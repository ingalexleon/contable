import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_dashboard_stats(client: AsyncClient, admin_token: str):
    """Test dashboard statistics endpoint."""
    response = await client.get(
        "/api/reports/dashboard",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "active_clients" in data
    assert "active_services" in data
    assert "payments" in data


@pytest.mark.asyncio
async def test_general_report(client: AsyncClient, admin_token: str):
    """Test general report endpoint."""
    response = await client.get(
        "/api/reports/general",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "total_clients" in data
    assert "total_revenue" in data


@pytest.mark.asyncio
async def test_client_report(client: AsyncClient, admin_token: str):
    """Test individual client report."""
    # Create a client
    cli_response = await client.post(
        "/api/clients/",
        json={
            "business_name": "Report Client",
            "client_type": "Persona Fisica",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    client_id = cli_response.json()["id"]

    response = await client.get(
        f"/api/reports/client/{client_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "client" in data
    assert "billing" in data
    assert "payments_summary" in data


@pytest.mark.asyncio
async def test_excel_export(client: AsyncClient, admin_token: str):
    """Test Excel export endpoint generates valid response."""
    response = await client.get(
        "/api/reports/export/excel?report_type=clients",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert "spreadsheetml" in response.headers.get("content-type", "")


@pytest.mark.asyncio
async def test_excel_export_payments(client: AsyncClient, admin_token: str):
    """Test Excel export for payments."""
    response = await client.get(
        "/api/reports/export/excel?report_type=payments",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert "spreadsheetml" in response.headers.get("content-type", "")
