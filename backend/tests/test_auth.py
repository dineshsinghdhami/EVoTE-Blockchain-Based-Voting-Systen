import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app


client = TestClient(app)


def test_backend_running():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "message": "Backend running successfully"
    }


def test_invalid_wallet_address():
    response = client.post(
        "/auth/metamask/nonce",
        json={
            "wallet_address": "invalid-wallet"
        }
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid wallet address"


def test_valid_wallet_address():
    response = client.post(
        "/auth/metamask/nonce",
        json={
            "wallet_address": "0x1111111111111111111111111111111111111111"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert "wallet_address" in data
    assert "message" in data
    assert "Nonce:" in data["message"]
    assert data["expires_in_seconds"] == 300


def test_missing_wallet_address():
    response = client.post(
        "/auth/metamask/nonce",
        json={}
    )

    assert response.status_code == 422


def test_invalid_wallet_length():
    response = client.post(
        "/auth/metamask/nonce",
        json={
            "wallet_address": "0x1234"
        }
    )

    assert response.status_code == 400


def test_wallet_without_0x():
    response = client.post(
        "/auth/metamask/nonce",
        json={
            "wallet_address": "1111111111111111111111111111111111111111"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert "wallet_address" in data
    assert "message" in data


def test_invalid_metamask_signature():
    wallet_address = "0x1111111111111111111111111111111111111111"

    nonce_response = client.post(
        "/auth/metamask/nonce",
        json={
            "wallet_address": wallet_address
        }
    )

    assert nonce_response.status_code == 200

    response = client.post(
        "/auth/metamask/verify",
        json={
            "wallet_address": wallet_address,
            "signature": "0x1234567890"
        }
    )

    assert response.status_code in [400, 401]

def test_verify_without_nonce():
    wallet_address = "0x2222222222222222222222222222222222222222"

    response = client.post(
        "/auth/metamask/verify",
        json={
            "wallet_address": wallet_address,
            "signature": "0x1234567890"
        }
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "No active nonce found. Request a new nonce."
    )

def test_unauthorized_access():
    response = client.get("/transactions")

    assert response.status_code in [401, 403]