import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_users_without_login():
    response = client.get("/users")

    assert response.status_code in [401, 403]


def test_admin_dashboard_without_login():
    response = client.get("/admin/dashboard")

    assert response.status_code in [401, 403, 404]