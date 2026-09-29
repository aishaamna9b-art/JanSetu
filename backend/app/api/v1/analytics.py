from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional, List
from app.models.schemas import AnalyticsSummaryResponse, HotspotResponse, TopCategory, TrendItem, GapAnalysisResponse
from app.core.security import require_role
from app.core.firebase import get_db
import json
import pandas as pd
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

@router.get("/gaps", response_model=List[GapAnalysisResponse])
def get_gap_analysis(
    district: Optional[str] = Query(None),
    current_user: dict = Depends(require_role(["officer", "admin"]))
):
    db = get_db()
    
    demand = defaultdict(int)
    
    if db:
        query = db.collection("requests")
        if district:
            query = query.where("location.district", "==", district)
        for doc in query.stream():
            d = doc.to_dict()
            loc = d.get("location", {})
            dist = loc.get("district")
            blk = loc.get("block")
            cat = d.get("category")
            if dist and blk and cat:
                demand[(dist, blk, cat)] += 1
    else:
        raw_data = get_local_data()
        for d in raw_data:
            loc = d.get("location", {})
            dist = loc.get("district")
            blk = loc.get("block")
            cat = d.get("category")
            if district and dist != district:
                continue
            if dist and blk and cat:
                demand[(dist, blk, cat)] += 1
                
    data_dir = Path(__file__).parent.parent.parent / "data" / "seed"
    try:
        df_demo = pd.read_csv(data_dir / "demographics.csv")
        df_infra = pd.read_csv(data_dir / "infra_index.csv")
        df_spend = pd.read_csv(data_dir / "public_spending.csv")
        
        df = df_infra.merge(df_demo, on=["district", "block"], how="left")
        df = df.merge(df_spend, on=["district", "block", "category"], how="left")
        
        if district:
            df = df[df["district"] == district]
            
        results = []
        for _, row in df.iterrows():
            dist = row["district"]
            blk = row["block"]
            cat = row["category"]
            
            pop = int(row.get("population", 100000))
            infra = float(row.get("infra_index", 0.5))
            spending = float(row.get("spending", 100000))
            
            d_count = demand.get((dist, blk, cat), 0)
            
            spending_norm = spending / max(pop, 1)
            
            gap_score = (d_count * 10.0) + ((1.0 - infra) * 50.0) - min(spending_norm / 10.0, 20.0)
            gap_score = max(0.0, round(gap_score, 2))
            
            results.append(GapAnalysisResponse(
                district=dist,
                block=blk,
                category=cat,
                demand_count=d_count,
                population=pop,
                infra_index=round(infra, 2),
                public_spending=round(spending, 2),
                gap_score=gap_score
            ))
            
        results.sort(key=lambda x: x.gap_score, reverse=True)
        return results
        
    except Exception as e:
        print(f"Error in gap analysis: {e}")
        return []
