from fastapi import APIRouter, Depends, HTTPException
from app.core.security import require_role
from app.models.schemas import SimulatorRunRequest, SimulatorRunResponse, ProjectRecommendation, ScoreBreakdown
from app.services.optimizer import run_simulation
from app.core.firebase import get_db
import random
import uuid

router = APIRouter()

@router.post("/run", response_model=SimulatorRunResponse)
def run_budget_simulator(
    request: SimulatorRunRequest,
    current_user: dict = Depends(require_role(["officer", "admin"]))
):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")
        
    clusters_ref = db.collection("clusters")
    
    query = clusters_ref.where("district", "==", request.district).where("state", "==", request.state)
    
    if request.categories:
        query = query.where("category", "in", request.categories)
        
    # Get top 50 clusters
    query = query.order_by("priority_score", direction="DESCENDING").limit(50)
    
    candidates = []
    
    for doc in query.stream():
        data = doc.to_dict()
        
        # Determine some derived values for the simulation based on the cluster data
        base_cost = random.uniform(500000, 5000000)
        people_served = data.get("count", 1) * random.randint(100, 1000)
        
        score_breakdown = data.get("score_breakdown", {
            "volume": data.get("count", 0),
            "urgency": 25.0,
            "severity": 20.0,
            "infra_gap": 15.0,
            "population": 15.0
        })
        
        rec = ProjectRecommendation(
            project_id=f"proj-{uuid.uuid4().hex[:6]}",
            cluster_id=doc.id,
            title=f"{data.get('block', 'Unknown')} {data.get('category', 'Infrastructure')} Project",
            category=data.get("category", "unknown"),
            region=f"{data.get('block', '')}, {data.get('district', '')}",
            people_served=people_served,
            cost_estimate=base_cost,
            priority_score=data.get("priority_score", 0.0),
            score_breakdown=ScoreBreakdown(**score_breakdown) if isinstance(score_breakdown, dict) else score_breakdown,
            ai_justification=""
        )
        candidates.append(rec)
        
    result = run_simulation(request, candidates)
    return result
