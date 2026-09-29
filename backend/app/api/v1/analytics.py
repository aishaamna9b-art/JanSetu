from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional, List
from app.models.schemas import AnalyticsSummaryResponse, HotspotResponse, TopCategory, TrendItem
from app.core.security import require_role
from app.core.firebase import get_db
import json
from collections import defaultdict
from pathlib import Path
from datetime import datetime

router = APIRouter()

def get_local_data():
    seed_file = Path(__file__).parent.parent.parent / "data" / "seed_requests.json"
    if not seed_file.exists():
        return []
    with open(seed_file, "r") as f:
        return json.load(f)

@router.get("/summary", response_model=AnalyticsSummaryResponse)
def get_analytics_summary(
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    current_user: dict = Depends(require_role(["officer"]))
):
    db = get_db()
    
    data = []
    if db:
        query = db.collection("requests")
        if state:
            query = query.where("location.state", "==", state)
        if district:
            query = query.where("location.district", "==", district)
        if category:
            query = query.where("category", "==", category)
            
        docs = query.stream()
        for doc in docs:
            data.append(doc.to_dict())
    else:
        # Local fallback using pure Python
        raw_data = get_local_data()
        for req in raw_data:
            loc = req.get("location", {})
            if state and loc.get("state") != state: continue
            if district and loc.get("district") != district: continue
            if category and req.get("category") != category: continue
            data.append(req)

    if not data:
        return AnalyticsSummaryResponse(
            total_requests=0,
            resolved_rate=0.0,
            top_categories=[],
            by_status={},
            trend=[]
        )
    
    total_requests = len(data)
    
    resolved_statuses = {"completed", "funded"}
    resolved_count = sum(1 for d in data if d.get("status") in resolved_statuses)
    resolved_rate = resolved_count / total_requests if total_requests > 0 else 0.0
    
    cat_counts = defaultdict(int)
    status_counts = defaultdict(int)
    date_counts = defaultdict(int)
    
    for req in data:
        cat_counts[req.get("category", "other")] += 1
        status_counts[req.get("status", "received")] += 1
        
        created_at = req.get("created_at")
        if created_at:
            try:
                # Basic ISO parsing
                dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                date_str = dt.strftime("%Y-%m-%d")
                date_counts[date_str] += 1
            except Exception:
                pass
                
    # Sort categories by count desc, take top 5
    sorted_cats = sorted(cat_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    top_categories = [TopCategory(category=k, count=v) for k, v in sorted_cats]
    
    # Sort dates
    sorted_dates = sorted(date_counts.items(), key=lambda x: x[0])
    trend = [TrendItem(date=k, count=v) for k, v in sorted_dates]
        
    return AnalyticsSummaryResponse(
        total_requests=total_requests,
        resolved_rate=round(resolved_rate, 2),
        top_categories=top_categories,
        by_status=dict(status_counts),
        trend=trend
    )

@router.get("/hotspots", response_model=List[HotspotResponse])
def get_analytics_hotspots(
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    current_user: dict = Depends(require_role(["officer"]))
):
    db = get_db()
    
    if db:
        query = db.collection("clusters")
        if district:
            query = query.where("district", "==", district)
        if category:
            query = query.where("category", "==", category)
            
        docs = query.stream()
        results = []
        for doc in docs:
            d = doc.to_dict()
            results.append(HotspotResponse(
                cluster_id=d["cluster_id"],
                category=d["category"],
                count=d.get("count", 0),
                lat=d.get("lat", 0.0),
                lng=d.get("lng", 0.0),
                district=d.get("district", ""),
                block=d.get("block", ""),
                priority_score=d.get("priority_score", 0.0),
                example_text=d.get("example_text", "")
            ))
        return results
    else:
        # Local fallback using pure Python
        raw_data = get_local_data()
        
        # Group by district, block, category
        groups = defaultdict(list)
        
        for req in raw_data:
            loc = req.get("location", {})
            req_state = loc.get("state")
            req_district = loc.get("district")
            req_block = loc.get("block")
            req_cat = req.get("category")
            
            if state and req_state != state: continue
            if district and req_district != district: continue
            if category and req_cat != category: continue
            
            if not req_district or not req_block or not req_cat:
                continue
                
            groups[(req_district, req_block, req_cat)].append(req)
            
        clusters = []
        for (dist, blk, cat), group in groups.items():
            cluster_id = next((r.get("cluster_id") for r in group if r.get("cluster_id")), f"cluster-{dist}-{cat}")
            
            lats = [r.get("location", {}).get("lat") for r in group if r.get("location", {}).get("lat") is not None]
            lngs = [r.get("location", {}).get("lng") for r in group if r.get("location", {}).get("lng") is not None]
            
            avg_lat = sum(lats)/len(lats) if lats else 0.0
            avg_lng = sum(lngs)/len(lngs) if lngs else 0.0
            
            urgencies = [r.get("urgency", 3) for r in group]
            avg_urgency = sum(urgencies)/len(urgencies) if urgencies else 3.0
            
            score = round(min(1.0, avg_urgency / 5.0 + len(group)*0.01), 2)
            example_text = group[0].get("original_text", "")
            
            clusters.append(HotspotResponse(
                cluster_id=cluster_id,
                category=cat,
                count=len(group),
                lat=avg_lat,
                lng=avg_lng,
                district=dist,
                block=blk,
                priority_score=score,
                example_text=example_text
            ))
            
        clusters.sort(key=lambda x: x.priority_score, reverse=True)
        return clusters
