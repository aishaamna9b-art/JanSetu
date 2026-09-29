from fastapi import APIRouter, Depends
from app.models.schemas import AuthSessionResponse
from app.core.security import get_current_user

router = APIRouter()

@router.post("/session", response_model=AuthSessionResponse)
def get_session(current_user: dict = Depends(get_current_user)):
    return AuthSessionResponse(
        uid=current_user.get("uid", "unknown"),
        role=current_user.get("role", "citizen"),
        language=current_user.get("language", "en"),
        region=current_user.get("region", "unknown")
    )
