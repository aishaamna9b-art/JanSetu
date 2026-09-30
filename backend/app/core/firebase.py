import os
import firebase_admin
from firebase_admin import credentials, firestore
from app.config import settings

db = None
firebase_initialized = False

def init_firebase():
    global db, firebase_initialized
    if firebase_initialized:
        return
        
    try:
        cred_path = settings.FIREBASE_CREDENTIALS_PATH
        cred_json = settings.FIREBASE_CREDENTIALS_JSON
        cred = None

        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
        elif cred_json:
            import json
            cred_dict = json.loads(cred_json)
            cred = credentials.Certificate(cred_dict)

        if cred:
            options = {
                'storageBucket': 'jansetu-47534.firebasestorage.app'
            }
            if not firebase_admin._apps:
                firebase_admin.initialize_app(cred, options)
            firebase_initialized = True
            print("Firebase Admin initialized successfully.")
            
            # Check Firestore accessibility
            try:
                test_client = firestore.client()
                # Run a light check to verify permissions
                list(test_client.collection("health_check").limit(1).stream())
                db = test_client
                print("Connected to Cloud Firestore successfully.")
            except Exception as e:
                print(f"Firestore not available or API disabled ({e}). Utilizing persistent local database.")
                db = None
        else:
            print("No valid Firebase credentials provided. Utilizing persistent local database.")
            db = None
    except Exception as e:
        print(f"Firebase initialization notice: {e}")
        db = None

def get_db():
    return db
