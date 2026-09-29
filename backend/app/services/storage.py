import uuid
from typing import Optional
from fastapi import UploadFile
from firebase_admin import storage
from app.config import settings

def upload_file_to_storage(file: UploadFile, folder: str = "uploads") -> Optional[str]:
    """Uploads a file to Firebase Storage and returns the public URL."""
    if settings.DEV_MODE:
        return f"https://mock-storage.com/{folder}/{uuid.uuid4().hex}_{file.filename}"
        
    try:
        bucket = storage.bucket()
        blob = bucket.blob(f"{folder}/{uuid.uuid4().hex}_{file.filename}")
        blob.upload_from_file(file.file, content_type=file.content_type)
        blob.make_public()
        return blob.public_url
    except Exception as e:
        print(f"Error uploading to storage: {e}")
        return None

def upload_local_file_to_storage(local_path: str, destination_blob_name: str) -> Optional[str]:
    """Uploads a local file to Firebase Storage and returns the public URL."""
    if settings.DEV_MODE:
        return f"https://mock-storage.com/{destination_blob_name}"
        
    try:
        bucket = storage.bucket()
        blob = bucket.blob(destination_blob_name)
        blob.upload_from_filename(local_path)
        blob.make_public()
        return blob.public_url
    except Exception as e:
        print(f"Error uploading to storage: {e}")
        return None

