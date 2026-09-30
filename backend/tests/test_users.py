import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.data import local_db

client = TestClient(app)

def test_profile_complete_logic():
    # Setup token logic mock: using dev-citizen-test-99
    response = client.patch(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer dev-citizen", "X-Dev-User": "dev-citizen-test-99"},
        json={"personal": {"full_name": "Partial Name"}}
    )
    assert response.status_code == 200
    assert response.json()["profile_complete"] == False
    
    full_info = {
        "personal": {"full_name": "Test User", "relation_type": "father", "relation_name": "Dad", "dob": "1990-01-01", "gender": "male"},
        "contact": {"mobile": "9876543210"},
        "address": {"house_no": "12", "village_or_ward": "Ward 2", "pincode": "110001", "block": "Block A", "district": "Dist X", "state": "State Y"},
        "preferences": {"language": "en"},
        "consent_given": True,
        "declaration_accepted": True
    }
    res = client.patch(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer dev-citizen", "X-Dev-User": "dev-citizen-test-99"},
        json=full_info
    )
    assert res.status_code == 200
    assert res.json()["profile_complete"] == True
    assert "registration_id" in res.json()
    assert res.json()["registration_id"].startswith("JS-ST-")

def test_invalid_pincode():
    res = client.get("/api/v1/regions/pincode/999999")
    assert res.status_code == 404
    assert res.json()["detail"] == "Pincode data not found"

def test_request_ownership():
    # Test that dev-citizen-1 can see requests
    res1 = client.get(
        "/api/v1/requests/mine",
        headers={"Authorization": "Bearer dev-citizen", "X-Dev-User": "dev-citizen-1"}
    )
    assert res1.status_code == 200
    
    # Test that a new citizen sees 0 requests
    res2 = client.get(
        "/api/v1/requests/mine",
        headers={"Authorization": "Bearer dev-citizen", "X-Dev-User": "dev-citizen-999"}
    )
    assert res2.status_code == 200
    assert len(res2.json()) == 0
