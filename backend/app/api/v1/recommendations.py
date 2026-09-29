from fastapi import APIRouter, Depends
from typing import List, Optional
from app.core.security import require_role
from app.models.schemas import ProjectRecommendation
from app.services.analytics_engine import analytics_engine

router = APIRouter()

@router.get("", response_model=List[ProjectRecommendation])
def get_recommendations(
    district: Optional[str] = None,
    limit: int = 10,
    current_user: dict = Depends(require_role(["officer", "admin"]))
):
    recs = analytics_engine.get_recommendations(district, limit)
    
    results = []
    for r in recs:
        results.append(ProjectRecommendation(**r))
        
    return results
