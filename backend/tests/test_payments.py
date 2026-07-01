import io
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_payment(client: AsyncClient, admin_token: str):
    """Test creating a payment."""
    # Create client first
    cli_response = await client.post(
        "/api/clients/",
        json={
            "business_name": "Payment Client",
            "phone": "5555555501",
            "rfc": "XAXX010101000",
            "client_type": "Persona Fisica",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    client_id = cli_response.json()["id"]

    response = await client.post(
        "/api/payments/",
        json={
            "client_id": client_id,
            "amount": 5000.0,
            "payment_date": "2024-01-15",
            "period_start": "2024-01-01",
            "period_end": "2024-01-31",
            "status": "pending",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == 5000.0
    assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_update_payment_status(client: AsyncClient, admin_token: str):
    """Test updating a payment status."""
    # Create client and payment
    cli_response = await client.post(
        "/api/clients/",
        json={
            "business_name": "Update Payment Client",
            "phone": "5555555502",
            "rfc": "UPC010101000",
            "client_type": "Persona Moral",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    client_id = cli_response.json()["id"]

    pay_response = await client.post(
        "/api/payments/",
        json={
            "client_id": client_id,
            "amount": 3000.0,
            "status": "pending",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    payment_id = pay_response.json()["id"]

    # Update status
    response = await client.put(
        f"/api/payments/{payment_id}",
        json={"status": "paid"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "paid"


@pytest.mark.asyncio
async def test_upload_payment_proof(client: AsyncClient, admin_token: str):
    """Test uploading a payment proof file."""
    # Create client and payment
    cli_response = await client.post(
        "/api/clients/",
        json={
            "business_name": "Proof Client",
            "phone": "5555555503",
            "rfc": "XAXX010101000",
            "client_type": "Persona Fisica",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    client_id = cli_response.json()["id"]

    pay_response = await client.post(
        "/api/payments/",
        json={
            "client_id": client_id,
            "amount": 7000.0,
            "status": "paid",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    payment_id = pay_response.json()["id"]

    # Upload proof (fake PDF)
    file_content = b"%PDF-1.4 fake pdf content"
    response = await client.post(
        f"/api/payments/{payment_id}/proof",
        files={"file": ("comprobante.pdf", io.BytesIO(file_content), "application/pdf")},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["payment_id"] == payment_id
    assert data["file_type"] == "application/pdf"
    assert "download_url" in data
    assert f"/payments/proofs/{data['id']}/download" == data["download_url"]


@pytest.mark.asyncio
async def test_list_payment_proofs(client: AsyncClient, admin_token: str):
    """Test listing proofs for a payment."""
    # Create client, payment, and upload proof
    cli_response = await client.post(
        "/api/clients/",
        json={
            "business_name": "Proofs List Client",
            "phone": "5555555504",
            "rfc": "PLC010101000",
            "client_type": "Persona Moral",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    client_id = cli_response.json()["id"]

    pay_response = await client.post(
        "/api/payments/",
        json={
            "client_id": client_id,
            "amount": 2000.0,
            "status": "paid",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    payment_id = pay_response.json()["id"]

    # Upload
    file_content = b"fake image content"
    await client.post(
        f"/api/payments/{payment_id}/proof",
        files={"file": ("recibo.png", io.BytesIO(file_content), "image/png")},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # List proofs
    response = await client.get(
        f"/api/payments/{payment_id}/proofs",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
