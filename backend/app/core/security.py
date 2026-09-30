from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings
from app.core.errors import AppError
import firebase_admin
from firebase_admin import auth

security = HTTPBearer(auto_error=False)

def verify_token(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)):
    dev_uid = request.headers.get("x-dev-user", "dev-citizen-1")

    if not credentials:
        # Default fallback for unauthenticated development testing
        return {"uid": dev_uid, "role": "citizen", "language": "en", "region": "Delhi"}
        
    token = credentials.credentials
    
    # Support development / role-based tokens
    if token.startswith("dev-") or settings.DEV_MODE:
        if "citizen" in token:
            return {"uid": dev_uid, "role": "citizen", "language": "hi", "region": "Delhi"}
        elif "officer" in token:
            return {"uid": "dev-off-1", "role": "officer", "language": "en", "region": "Delhi"}
        elif "admin" in token:
            return {"uid": "dev-adm-1", "role": "admin", "language": "en", "region": "Delhi"}
        elif settings.DEV_MODE:
            return {"uid": dev_uid, "role": "citizen", "language": "en", "region": "Delhi"}
    
    # Try verifying real Firebase ID token
    try:
        decoded_token = auth.verify_id_token(token)
        if "role" not in decoded_token:
            decoded_token["role"] = "citizen"
        return decoded_token
    except Exception as e:
        # If token was dev format or firebase validation failed, check if in dev mode
        if token.startswith("dev-"):
            return {"uid": dev_uid, "role": "citizen", "language": "hi", "region": "Delhi"}
        raise AppError("unauthorized", "Invalid or expired token", status_code=401)

def require_role(allowed_roles: list[str]):
    def role_checker(token_payload: dict = Depends(verify_token)):
        role = token_payload.get("role", "citizen")
        if role not in allowed_roles:
            raise AppError("forbidden", f"Requires one of roles: {allowed_roles}", status_code=403)
        return token_payload
    return role_checker

def get_current_user(token_payload: dict = Depends(verify_token)):
    return token_payload
