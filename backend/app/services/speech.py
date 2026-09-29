import os
from google.cloud import speech
from app.config import settings

def transcribe_audio(audio_bytes: bytes, language_code: str = "en-IN") -> str:
    """Converts audio bytes to text using Google Cloud Speech-to-Text."""
    if settings.DEV_MODE:
        return f"[MOCK TRANSCRIPT in {language_code}]: Pothole near the main market."

    try:
        client = speech.SpeechClient()
        audio = speech.RecognitionAudio(content=audio_bytes)
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            language_code=language_code,
        )
        response = client.recognize(config=config, audio=audio)
        
        transcript = ""
        for result in response.results:
            transcript += result.alternatives[0].transcript
            
        return transcript
    except Exception as e:
        print(f"Error in STT: {e}")
        return ""
