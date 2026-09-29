from google import genai
from app.config import settings

def get_gemini_client():
    return genai.Client(api_key=settings.GEMINI_API_KEY)

def generate_embedding(text: str) -> list[float]:
    """Generates an embedding vector for the given text using Gemini."""
    if settings.DEV_MODE:
        # Mock embedding of size 768
        return [0.1] * 768
        
    try:
        client = get_gemini_client()
        result = client.models.embed_content(
            model="text-embedding-004",
            contents=text
        )
        return result.embeddings[0].values
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return [0.0] * 768
