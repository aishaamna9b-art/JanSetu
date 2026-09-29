from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings
from app.core.errors import AppError
import firebase_admin
from firebase_admin import auth

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if settings.DEV_MODE:
        token = credentials.credentials
        if token == "dev-citizen-token":
            return {"uid": "dev-cit-1", "role": "citizen", "language": "hi", "region": "Delhi"}
        elif token == "dev-officer-token":
            return {"uid": "dev-off-1", "role": "officer", "language": "en", "region": "Delhi"}
        elif token == "dev-admin-token":
            return {"uid": "dev-adm-1", "role": "admin", "language": "en", "region": "Delhi"}
        else:
            raise AppError("invalid_token", "Invalid token for DEV_MODE", status_code=401)
    
    try:
        token = credentials.credentials
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise AppError("unauthorized", "Invalid or expired token", status_code=401)

def require_role(allowed_roles: list[str]):
    def role_checker(token_payload: dict = Depends(verify_token)):
        role = token_payload.get("role")
        if role not in allowed_roles:
            raise AppError("forbidden", f"Requires one of roles: {allowed_roles}", status_code=403)
        return token_payload
    return role_checker

def get_current_user(token_payload: dict = Depends(verify_token)):
    return token_payload
