from fastapi import APIRouter, Depends, HTTPException
from app.core.security import require_role
from app.models.schemas import SimulatorRunRequest, SimulatorRunResponse, ProjectRecommendation
from app.services.optimizer import run_simulation
from app.services.analytics_engine import analytics_engine

router = APIRouter()

@router.post("/run", response_model=SimulatorRunResponse)
def run_budget_simulator(
    request: SimulatorRunRequest,
    current_user: dict = Depends(require_role(["officer", "admin"]))
):
    recs = analytics_engine.get_recommendations(district=request.district, limit=50)
    
    candidates = []
    for r in recs:
        if request.categories and r["category"] not in request.categories:
            continue
            
        rec = ProjectRecommendation(**r)
        candidates.append(rec)
        
    result = run_simulation(request, candidates)
    return result
