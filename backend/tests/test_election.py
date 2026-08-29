import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_blockchain_connection_endpoint():
    response = client.get("/test-blockchain")

    assert response.status_code == 200
    assert "connected" in response.json()


def test_create_institution_without_login():
    response = client.post(
        "/blockchain/create-institution",
        json={
            "name": "Test Institution"
        }
    )

    assert response.status_code in [401, 403]


def test_create_organization_without_login():
    response = client.post(
        "/blockchain/create-organization",
        json={
            "institution_id": 1,
            "name": "Test Organization"
        }
    )

    assert response.status_code in [401, 403]


def test_create_election_post_without_login():
    response = client.post(
        "/blockchain/create-post",
        json={
            "institution_id": 1,
            "organization_id": 1,
            "title": "Test Election",
            "seat_count": 1,
            "voting_start": 1000000000,
            "voting_end": 2000000000,
            "max_candidate_count": 5,
            "min_candidate_age": 18,
            "max_candidate_age": 60
        }
    )

    assert response.status_code in [401, 403]