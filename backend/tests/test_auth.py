import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.deps import get_db
from app.models.user import User


# Setup in-memory SQLite database for isolated unit/integration tests
TEST_DATABASE_URL = "sqlite:///:memory:"

engine_test = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


@pytest.fixture(autouse=True)
def setup_test_db():
    User.__table__.create(engine_test, checkfirst=True)
    yield
    User.__table__.drop(engine_test, checkfirst=True)


@pytest.fixture
def client():
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_cors_headers(client):
    response = client.options(
        "/auth/login",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_register_success(client):
    response = client.post(
        "/auth/register",
        json={
            "name": "Aarav Patel",
            "email": "aarav@example.com",
            "phone": "+919876543210",
            "password": "securepassword123",
            "role": "user",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["name"] == "Aarav Patel"
    assert data["user"]["email"] == "aarav@example.com"
    assert data["user"]["phone"] == "+919876543210"
    assert data["user"]["role"] == "user"


def test_register_duplicate_email(client):
    payload = {
        "name": "User One",
        "email": "duplicate@example.com",
        "phone": "+919876543211",
        "password": "password123",
    }
    r1 = client.post("/auth/register", json=payload)
    assert r1.status_code == 201

    payload2 = {
        "name": "User Two",
        "email": "duplicate@example.com",
        "phone": "+919876543212",
        "password": "password456",
    }
    r2 = client.post("/auth/register", json=payload2)
    assert r2.status_code == 400
    assert "email already exists" in r2.json()["detail"]


def test_register_duplicate_phone(client):
    payload = {
        "name": "User One",
        "email": "user1@example.com",
        "phone": "+919876543213",
        "password": "password123",
    }
    r1 = client.post("/auth/register", json=payload)
    assert r1.status_code == 201

    payload2 = {
        "name": "User Two",
        "email": "user2@example.com",
        "phone": "+919876543213",
        "password": "password456",
    }
    r2 = client.post("/auth/register", json=payload2)
    assert r2.status_code == 400
    assert "phone number already exists" in r2.json()["detail"]


def test_register_missing_identifiers(client):
    response = client.post(
        "/auth/register",
        json={
            "name": "No Identifier",
            "password": "password123",
        },
    )
    assert response.status_code == 422


def test_login_success_with_email(client):
    client.post(
        "/auth/register",
        json={
            "name": "Login Test User",
            "email": "login@example.com",
            "password": "correctpassword",
        },
    )

    response = client.post(
        "/auth/login",
        json={
            "email": "login@example.com",
            "password": "correctpassword",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "login@example.com"


def test_login_success_with_phone(client):
    client.post(
        "/auth/register",
        json={
            "name": "Phone User",
            "phone": "+919999988888",
            "password": "phonepassword123",
        },
    )

    response = client.post(
        "/auth/login",
        json={
            "phone": "+919999988888",
            "password": "phonepassword123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["phone"] == "+919999988888"


def test_login_invalid_password(client):
    client.post(
        "/auth/register",
        json={
            "name": "Wrong Pw User",
            "email": "wrongpw@example.com",
            "password": "correctpassword",
        },
    )

    response = client.post(
        "/auth/login",
        json={
            "email": "wrongpw@example.com",
            "password": "incorrectpassword",
        },
    )
    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["detail"]


def test_login_nonexistent_user(client):
    response = client.post(
        "/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "somepassword",
        },
    )
    assert response.status_code == 401


def test_get_me_authenticated(client):
    reg = client.post(
        "/auth/register",
        json={
            "name": "Profile User",
            "email": "profile@example.com",
            "phone": "+919123456789",
            "password": "mypassword123",
        },
    )
    token = reg.json()["access_token"]

    response = client.get(
        "/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Profile User"
    assert data["email"] == "profile@example.com"
    assert data["phone"] == "+919123456789"


def test_get_me_unauthorized(client):
    response = client.get("/me")
    assert response.status_code == 401


def test_get_me_invalid_token(client):
    response = client.get(
        "/me",
        headers={"Authorization": "Bearer totally_invalid_token"},
    )
    assert response.status_code == 401


def test_update_me(client):
    reg = client.post(
        "/auth/register",
        json={
            "name": "Old Name",
            "email": "old@example.com",
            "password": "password123",
        },
    )
    token = reg.json()["access_token"]

    response = client.put(
        "/me",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "New Name",
            "push_token": "fcm_token_xyz_123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Name"
    assert data["push_token"] == "fcm_token_xyz_123"
    assert data["email"] == "old@example.com"


def test_forgot_and_reset_password_flow(client):
    # Register user
    client.post(
        "/auth/register",
        json={
            "name": "Reset Test User",
            "email": "reset@example.com",
            "password": "initialpassword",
        },
    )

    # Request password reset
    forgot_res = client.post(
        "/auth/forgot-password",
        json={"email": "reset@example.com"},
    )
    assert forgot_res.status_code == 200
    reset_token = forgot_res.json()["reset_token"]
    assert reset_token is not None

    # Reset password with invalid token -> 400
    bad_reset = client.post(
        "/auth/reset-password",
        json={
            "reset_token": "invalid_or_expired_token",
            "new_password": "brandnewpassword123",
        },
    )
    assert bad_reset.status_code == 400

    # Reset password with valid token -> 200
    good_reset = client.post(
        "/auth/reset-password",
        json={
            "reset_token": reset_token,
            "new_password": "brandnewpassword123",
        },
    )
    assert good_reset.status_code == 200
    assert "successfully reset" in good_reset.json()["message"]

    # Login with old password fails
    old_login = client.post(
        "/auth/login",
        json={
            "email": "reset@example.com",
            "password": "initialpassword",
        },
    )
    assert old_login.status_code == 401

    # Login with new password succeeds
    new_login = client.post(
        "/auth/login",
        json={
            "email": "reset@example.com",
            "password": "brandnewpassword123",
        },
    )
    assert new_login.status_code == 200
    assert "access_token" in new_login.json()

