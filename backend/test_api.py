from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

# Force DEV_MODE to true for testing without credentials
settings.DEV_MODE = True

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    print("Health check passed.")

def test_create_request_text():
    response = client.post(
        "/api/v1/requests",
        headers={"Authorization": "Bearer dev-citizen-token"},
        data={
            "text": "There is a big pothole here",
            "language": "en",
            "lat": 28.7,
            "lng": 77.1
        }
    )
    if response.status_code == 200:
        data = response.json()
        print("Create text request passed:", data["id"])
    else:
        print("Create text request failed:", response.status_code, response.text)

if __name__ == "__main__":
    test_health()
    test_create_request_text()
    print("All tests completed.")
