import firebase_admin
from firebase_admin import credentials, firestore
from app.config import settings

db = None

def init_firebase():
    global db
    if settings.DEV_MODE:
        pass
    else:
        if settings.FIREBASE_CREDENTIALS_PATH:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)
        else:
            firebase_admin.initialize_app()
        db = firestore.client()

def get_db():
    return db
