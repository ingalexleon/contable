import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, admin_token: str):
    """Test login with valid credentials."""
    response = await client.post(
        "/api/auth/login",
        json={"email": "admin@test.com", "password": "admin123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient, admin_token: str):
    """Test login with wrong password."""
    response = await client.post(
        "/api/auth/login",
        json={"email": "admin@test.com", "password": "wrong"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, admin_token: str):
    """Test GET /auth/me returns current user."""
    response = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admin@test.com"
    assert data["full_name"] == "Test Admin"


@pytest.mark.asyncio
async def test_register_admin_only(client: AsyncClient, admin_token: str, standard_token: str):
    """Test that only admins can register new users."""
    # Standard user cannot register
    response = await client.post(
        "/api/auth/register",
        json={
            "email": "new@test.com",
            "password": "newpass123",
            "full_name": "New User",
            "role_id": 2,
        },
        headers={"Authorization": f"Bearer {standard_token}"},
    )
    assert response.status_code == 403

    # Admin can register
    response = await client.post(
        "/api/auth/register",
        json={
            "email": "new@test.com",
            "password": "newpass123",
            "full_name": "New User",
            "role_id": 2,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "new@test.com"


@pytest.mark.asyncio
async def test_forgot_password(client: AsyncClient, admin_token: str):
    """Test forgot password endpoint."""
    response = await client.post(
        "/api/auth/forgot-password",
        json={"email": "admin@test.com"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "message" in data


@pytest.mark.asyncio
async def test_reset_password(client: AsyncClient, admin_token: str):
    """Test password reset with a valid token."""
    from app.core.security import create_reset_token

    token = create_reset_token("admin@test.com")
    response = await client.post(
        "/api/auth/reset-password",
        json={"token": token, "new_password": "newpassword123"},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_logout(client: AsyncClient, admin_token: str):
    """Test logout endpoint."""
    response = await client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Logged out successfully"
