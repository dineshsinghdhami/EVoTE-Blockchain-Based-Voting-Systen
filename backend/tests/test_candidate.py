import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_candidate_requests_without_login():
    response = client.get("/candidate-requests")

    assert response.status_code in [401, 403]


def test_candidate_request_invalid_user():
    response = client.post(
        "/request-candidate/999999",
        json={
            "institution_id": 999999,
            "organization_id": 999999,
            "election_id": 999999
        }
    )

    assert response.status_code in [
        400,
        401,
        403,
        404,
        422
    ]