import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_vote_without_login():
    response = client.post(
        "/vote",
        json={
            "candidate_id": 1,
            "election_id": 1
        }
    )

    assert response.status_code in [
        401,
        403,
        404,
        422
    ]


def test_vote_with_invalid_candidate():
    response = client.post(
        "/vote",
        json={
            "candidate_id": 999999,
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