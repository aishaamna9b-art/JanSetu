from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

headers = {"Authorization": "Bearer dev-admin-token"}

def test_analytics_summary():
    response = client.get("/api/v1/analytics/summary", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_requests" in data
    assert "resolved_rate" in data

def test_analytics_hotspots():
    response = client.get("/api/v1/analytics/hotspots", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_analytics_gaps_ranking():
    response = client.get("/api/v1/analytics/gaps", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    
    if len(data) >= 2:
        # Verify the highest ranked gap has a higher or equal gap_score than the next
        assert data[0]["gap_score"] >= data[1]["gap_score"]

def test_data_sources_endpoint():
    response = client.get("/api/v1/analytics/data-sources", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "data_sources" in data
    assert len(data["data_sources"]) > 0
