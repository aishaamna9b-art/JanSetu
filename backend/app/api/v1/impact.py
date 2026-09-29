from fastapi import APIRouter, Depends
from typing import Optional
from app.core.security import require_role
from app.core.firebase import get_db

router = APIRouter()

@router.get("")
def get_impact(
    state: Optional[str] = None,
    district: Optional[str] = None,
    current_user: dict = Depends(require_role(["officer", "admin"]))
):
    db = get_db()
    if not db:
        return []
        
    query = db.collection("requests")
    if district:
        query = query.where("location.district", "==", district)
        
    raised = 0
    resolved = 0
    
    for doc in query.stream():
        data = doc.to_dict()
        raised += 1
        if data.get("status") == "completed":
            resolved += 1
            
    res_rate = resolved / raised if raised > 0 else 0.0
    
    return [
        {
            "district": district or "All",
            "raised": raised,
            "resolved": resolved,
            "resolution_rate": res_rate
        }
    ]
