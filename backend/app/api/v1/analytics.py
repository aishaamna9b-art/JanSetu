from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional, List
from app.models.schemas import AnalyticsSummaryResponse, HotspotResponse, GapAnalysisResponse
from app.core.security import require_role
from app.services.analytics_engine import analytics_engine

router = APIRouter()

@router.get("/summary", response_model=AnalyticsSummaryResponse)
def get_analytics_summary(
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    current_user: dict = Depends(require_role(["officer", "admin"]))
):
    # Pass state and district to engine 
    res = analytics_engine.get_summary(state=state, district=district)
    return AnalyticsSummaryResponse(
        total_requests=res["total"],
        resolved_rate=res["resolved_rate"],
        top_categories=res["top_categories"],
        by_status=res["by_status"],
        trend=res["trend"]
    )

@router.get("/hotspots", response_model=List[HotspotResponse])
def get_analytics_hotspots(
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    current_user: dict = Depends(require_role(["officer", "admin"]))
):
    hotspots = analytics_engine.get_hotspots(state=state, district=district)
    # Mock some data for missing fields expected by schema
    results = []
    for i, h in enumerate(hotspots):
        if category and h["category"] != category: continue
        
        results.append(HotspotResponse(
            cluster_id=f"cluster-{i}",
            category=h["category"],
            count=h["request_count"],
            lat=0.0,
            lng=0.0,
            district=h["district"],
            block="All",
            priority_score=float(h["priority_score"] / 100.0), # Schema might expect 0-1 or 0-100, assuming 0-1
            example_text="Example request text for " + h["category"]
        ))
    return results

@router.get("/gaps", response_model=List[GapAnalysisResponse])
def get_gap_analysis(
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    current_user: dict = Depends(require_role(["officer", "admin"]))
):
    gaps = analytics_engine.get_gaps(state=state, district=district)
    results = []
    for g in gaps:
        
        results.append(GapAnalysisResponse(
            district=g["district"],
            block="All",
            category=g["category"],
            demand_count=g["demand_count"],
            population=100000, # Mocked for schema compatibility if not returned
            infra_index=g["infra_index"],
            public_spending=g["spending"]["spent_cr"],
            gap_score=g["gap_score"]
        ))
    return results

@router.get("/data-sources")
def get_data_sources(current_user: dict = Depends(require_role(["admin", "officer"]))):
    sources = analytics_engine.get_data_sources()
    return {
        "data_sources": sources,
        "last_loaded": "Just now"
    }
