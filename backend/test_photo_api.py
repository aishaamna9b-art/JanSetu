from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_request():
    print("Testing create_request endpoint...")
    
    # We need a mock file to upload
    file_content = b"fake image bytes"
    
    response = client.post(
        "/api/v1/requests",
        headers={"Authorization": "Bearer dev-citizen-token"},
        data={
            "language": "en",
            "text": "A large tree has fallen on the main road",
            "lat": 12.34,
            "lng": 56.78
        },
        files={
            "photo": ("test_image.jpg", file_content, "image/jpeg")
        }
    )
    
    if response.status_code == 200:
        print("Success!")
        print(response.json())
    else:
        print(f"Failed with status code {response.status_code}")
        print(response.text)
        
if __name__ == "__main__":
    test_create_request()
