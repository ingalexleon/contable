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
    assert "total_clients" in data
    assert "active_clients" in data
    assert "active_services" in data
    assert "monthly_revenue" in data
    assert "pending_payments" in data
    assert "monthly_revenue_chart" in data
    assert "client_type_distribution" in data
    assert "top_services" in data
    # Backward compatible
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
    assert "active_clients" in data
    assert "active_services" in data
    assert "total_revenue" in data
    assert "total_payments" in data


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
    # Backward compatible nested structure
    assert "client" in data
    assert "billing" in data
    assert "payments_summary" in data
    # New flat fields expected by frontend
    assert "total_paid" in data
    assert "total_pending" in data
    assert "active_services" in data


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


@pytest.mark.asyncio
async def test_excel_export_services(client: AsyncClient, admin_token: str):
    """Test Excel export for services."""
    response = await client.get(
        "/api/reports/export/excel?report_type=services",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert "spreadsheetml" in response.headers.get("content-type", "")


@pytest.mark.asyncio
async def test_excel_export_all(client: AsyncClient, admin_token: str):
    """Test Excel export for all data."""
    response = await client.get(
        "/api/reports/export/excel?report_type=all",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert "spreadsheetml" in response.headers.get("content-type", "")
