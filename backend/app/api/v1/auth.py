from fastapi import APIRouter, Depends
from app.models.schemas import AuthSessionResponse, UserProfileSchema, ContactDetailsSchema
from app.core.security import get_current_user
from app.data import local_db
from datetime import datetime, timezone

router = APIRouter()

@router.post("/session", response_model=AuthSessionResponse)
def get_session(current_user: dict = Depends(get_current_user)):
    uid = current_user.get("uid", "unknown")
    role = current_user.get("role", "citizen")
    
    is_new_user = False
    profile_complete = False

    if role == "citizen":
        user_doc = local_db.get_user(uid)
        if not user_doc:
            profile = UserProfileSchema(
                uid=uid,
                role=role,
                contact=ContactDetailsSchema(mobile=current_user.get("phone", "")),
                created_at=datetime.now(timezone.utc).isoformat()
            )
            local_db.save_user(uid, profile.model_dump())
            is_new_user = True
            profile_complete = False
        else:
            is_new_user = False
            profile_complete = user_doc.get("profile_complete", False)
            
    return AuthSessionResponse(
        uid=uid,
        role=role,
        language=current_user.get("language", "en"),
        region=current_user.get("region", "unknown"),
        is_new_user=is_new_user,
        profile_complete=profile_complete
    )
