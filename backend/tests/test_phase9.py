from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

headers = {"Authorization": "Bearer dev-admin-token"}

def test_impact_endpoint():
    response = client.get("/api/v1/impact?state=Delhi&district=North+West+Delhi", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_admin_users_endpoint():
    response = client.get("/api/v1/admin/users", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) > 0
    
def test_briefs_generate_endpoint():
    response = client.post("/api/v1/briefs/generate", json={"state": "Delhi", "district": "North West Delhi"}, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "brief_url" in data
    assert "summary" in data

