from fastapi import APIRouter, Depends
from typing import Optional
from app.core.security import require_role
from app.services.analytics_engine import analytics_engine

router = APIRouter()

@router.get("")
def get_impact(
    state: Optional[str] = None,
    district: Optional[str] = None,
    current_user: dict = Depends(require_role(["officer", "admin"]))
):
    return analytics_engine.get_impact(state, district)
