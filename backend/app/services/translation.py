from google.cloud import translate_v2 as translate
from app.config import settings

def translate_to_english(text: str) -> str:
    """Translates text to English using Google Cloud Translation API."""
    if settings.DEV_MODE:
        return f"[MOCK TRANSLATION to EN]: {text}"
        
    try:
        client = translate.Client()
        result = client.translate(text, target_language="en")
        return result["translatedText"]
    except Exception as e:
        print(f"Error in Translation: {e}")
        return text
