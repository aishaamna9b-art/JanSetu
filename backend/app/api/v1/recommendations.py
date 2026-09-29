from fastapi import APIRouter, Depends
from typing import List, Optional
from app.core.security import require_role
from app.core.firebase import get_db
from app.models.schemas import HotspotResponse

router = APIRouter()

@router.get("", response_model=List[HotspotResponse])
def get_recommendations(
    district: Optional[str] = None,
    limit: int = 10,
    current_user: dict = Depends(require_role(["officer", "admin"]))
):
    db = get_db()
    if not db:
        return []
        
    clusters_ref = db.collection("clusters")
    
    if district:
        query = clusters_ref.where("district", "==", district).order_by("priority_score", direction="DESCENDING").limit(limit)
    else:
        query = clusters_ref.order_by("priority_score", direction="DESCENDING").limit(limit)
        
    results = []
    for doc in query.stream():
        data = doc.to_dict()
        results.append(HotspotResponse(
            cluster_id=data.get("cluster_id", doc.id),
            category=data.get("category", "unknown"),
            count=data.get("count", 1),
            lat=data.get("lat", 0.0),
            lng=data.get("lng", 0.0),
            district=data.get("district", ""),
            block=data.get("block", ""),
            priority_score=data.get("priority_score", 0.0),
            example_text=data.get("example_text", "")
        ))
        
    return results
