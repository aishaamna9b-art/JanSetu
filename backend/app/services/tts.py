import uuid
from google.cloud import texttospeech
from app.config import settings
from app.services.storage import upload_file_to_storage
from fastapi import UploadFile
import io

class MockFile(UploadFile):
    def __init__(self, filename, content, content_type):
        self.filename = filename
        self.file = io.BytesIO(content)
        self.content_type = content_type

def generate_tts_url(text: str, language_code: str = "en-IN") -> str:
    """Generates TTS audio and uploads it to storage, returning the URL."""
    if settings.DEV_MODE:
        return f"https://mock-storage.com/tts/{uuid.uuid4().hex}.mp3"
        
    try:
        client = texttospeech.TextToSpeechClient()
        synthesis_input = texttospeech.SynthesisInput(text=text)
        
        voice = texttospeech.VoiceSelectionParams(
            language_code=language_code,
            ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
        )
        
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )
        
        response = client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )
        
        filename = f"tts_{uuid.uuid4().hex}.mp3"
        mock_upload_file = MockFile(filename, response.audio_content, "audio/mpeg")
        
        url = upload_file_to_storage(mock_upload_file, folder="tts")
        return url or ""
    except Exception as e:
        print(f"Error in TTS: {e}")
        return ""
