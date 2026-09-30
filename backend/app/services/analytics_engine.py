import sqlite3
import os
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from collections import defaultdict
from app.core.firebase import get_db

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(BASE_DIR, 'app', 'data', 'jansetu.db')

class AnalyticsEngine:
    def __init__(self):
        self.conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        
    def _get_firestore_requests(self) -> List[Dict[str, Any]]:
        db = get_db()
        if not db:
            try:
                c = self.conn.cursor()
                c.execute("SELECT * FROM requests")
                return [dict(r) for r in c.fetchall()]
            except Exception:
                return []
            
        try:
            docs = db.collection("requests").stream()
            records = []
            for doc in docs:
                d = doc.to_dict()
                loc = d.get('location', {})
                records.append({
                    'id': d.get('id'),
                    'category': d.get('category'),
                    'district': loc.get('district'),
                    'state': loc.get('state'),
                    'status': d.get('status'),
                    'urgency': d.get('urgency'),
                    'district_code': d.get('district_code')
                })
            if not records:
                # Fallback to local DB if firestore is empty
                c = self.conn.cursor()
                c.execute("SELECT * FROM requests")
                return [dict(r) for r in c.fetchall()]
            return records
        except Exception:
            c = self.conn.cursor()
            c.execute("SELECT * FROM requests")
            return [dict(r) for r in c.fetchall()]
        
    def get_summary(self, state: Optional[str] = None, district: Optional[str] = None) -> Dict[str, Any]:
        records = self._get_firestore_requests()
        if not records:
            return {"total": 0, "resolved_rate": 0.0, "top_categories": [], "by_status": {}, "trend": []}
            
        filtered = []
        for r in records:
            if state and r.get('state') != state and r.get('state') is not None:
                continue
            if district and r.get('district') != district:
                continue
            filtered.append(r)
            
        if not filtered:
            return {"total": 0, "resolved_rate": 0.0, "top_categories": [], "by_status": {}, "trend": []}
            
        status_counts = defaultdict(int)
        cat_counts = defaultdict(int)
        
        for r in filtered:
            status_counts[r.get('status')] += 1
            cat_counts[r.get('category')] += 1
            
        top_cats = sorted(cat_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        top_categories = [{"category": k, "count": v} for k, v in top_cats]
        
        resolved = status_counts.get("completed", 0) + status_counts.get("funded", 0)
        res_rate = resolved / len(filtered) if len(filtered) > 0 else 0.0
        
        return {
            "total": len(filtered),
            "resolved_rate": res_rate,
            "top_categories": top_categories,
            "by_status": dict(status_counts),
            "trend": [{"date": datetime.now(timezone.utc).isoformat()[:10], "count": len(filtered)}]
        }
        
    def get_gaps(self, state: Optional[str] = None, district: Optional[str] = None) -> List[Dict[str, Any]]:
        records = self._get_firestore_requests()
        if not records:
            return []
            
        filtered = []
        for r in records:
            if state and r.get('state') != state and r.get('state') is not None:
                continue
            if district and r.get('district') != district:
                continue
            filtered.append(r)
            
        if not filtered:
            return []
            
        demand = defaultdict(int)
        for r in filtered:
            if r.get('district') and r.get('category'):
                demand[(r.get('district'), r.get('category'))] += 1
                
        c = self.conn.cursor()
        query = """
        SELECT d.district, i.category, i.index_score, d.population, p.allocated_cr, p.spent_cr
        FROM demographics d
        JOIN infra_index i ON d.district_code = i.district_code
        LEFT JOIN public_investment p ON d.district_code = p.district_code AND i.category = p.category
        """
        c.execute(query)
        infra_rows = c.fetchall()
        
        infra_dict = {}
        for row in infra_rows:
            infra_dict[(row['district'], row['category'])] = dict(row)
            
        results = []
        for (dist, cat), demand_count in demand.items():
            infra = infra_dict.get((dist, cat), {})
            
            pop = float(infra.get('population') or 100000.0)
            allocated = float(infra.get('allocated_cr') or 0.0)
            spent = float(infra.get('spent_cr') or 0.0)
            infra_idx = float(infra.get('index_score') or 0.5)
            
            demand_per_lakh = (demand_count / pop) * 100000
            
            if allocated <= 0:
                spend_ratio = 0
            else:
                spend_ratio = spent / allocated
                
            gap_score = demand_per_lakh * (1 - infra_idx) * (1 - spend_ratio)
            
            results.append({
                "district": dist,
                "category": cat,
                "demand_count": int(demand_count),
                "infra_index": infra_idx,
                "population": pop,
                "spending": {"allocated_cr": allocated, "spent_cr": spent},
                "gap_score": float(gap_score)
            })
            
        return sorted(results, key=lambda x: x["gap_score"], reverse=True)
        
    def get_hotspots(self, state: Optional[str] = None, district: Optional[str] = None) -> List[Dict[str, Any]]:
        gaps = self.get_gaps(state=state, district=district)
        hotspots = []
        for g in gaps[:10]:
            hotspots.append({
                "district": g["district"],
                "category": g["category"],
                "request_count": g["demand_count"],
                "priority_score": min(100, int(g["gap_score"] * 10))
            })
        return hotspots

    def get_data_sources(self) -> List[Dict[str, Any]]:
        try:
            c = self.conn.cursor()
            c.execute("SELECT * FROM dataset_metadata")
            return [dict(r) for r in c.fetchall()]
        except Exception:
            return []
            
    def get_recommendations(self, state: Optional[str] = None, district: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        gaps = self.get_gaps(state=state, district=district)
        recs = []
        for i, g in enumerate(gaps):
            pop = g.get("population", 100000)
            gap_pct = 1 - g["infra_index"]
            people_served = int(pop * gap_pct)
            
            cost_estimate = people_served * 5000 / 10000000 # in Cr
            
            # Normalize breakdown scores to sum to priority_score (max 100)
            vol_score = min(35.0, (g["demand_count"] / 500.0) * 10.0)
            urgency_score = 15.0 # Fixed base urgency
            severity_score = 15.0 # Fixed base severity
            infra_score = min(25.0, gap_pct * 30.0)
            pop_score = min(10.0, (pop / 500000.0) * 5.0)
            
            total_score = vol_score + urgency_score + severity_score + infra_score + pop_score
            
            recs.append({
                "project_id": f"proj-{i}",
                "cluster_id": f"cluster-{i}",
                "title": f"Enhance {g['category'].capitalize()} in {g['district']}",
                "category": g["category"],
                "region": g["district"],
                "people_served": people_served,
                "cost_estimate": max(0.5, round(cost_estimate, 2)),
                "priority_score": round(total_score, 1),
                "score_breakdown": {
                    "volume": round(vol_score, 1),
                    "urgency": round(urgency_score, 1),
                    "severity": round(severity_score, 1),
                    "infra_gap": round(infra_score, 1),
                    "population": round(pop_score, 1)
                },
                "ai_justification": f"High demand ({g['demand_count']} requests) combined with low infrastructure coverage ({g['infra_index']:.2f}) in {g['district']} necessitates immediate {g['category']} investment."
            })
            
            if len(recs) >= limit:
                break
                
        return recs

    def get_impact(self, state: Optional[str] = None, district: Optional[str] = None) -> List[Dict[str, Any]]:
        records = self._get_firestore_requests()
        if not records:
            return []
            
        if district:
            records = [r for r in records if r.get('district') == district]
            
        if not records:
            return []
            
        dist_stats = defaultdict(lambda: {"raised": 0, "resolved": 0})
        
        for r in records:
            d = r.get('district') or 'Unknown'
            dist_stats[d]["raised"] += 1
            if r.get('status') == 'completed':
                dist_stats[d]["resolved"] += 1
                
        results = []
        for d, stats in dist_stats.items():
            raised = stats["raised"]
            resolved = stats["resolved"]
            res_rate = resolved / raised if raised > 0 else 0.0
            
            results.append({
                "district": d,
                "raised": raised,
                "resolved": resolved,
                "resolution_rate": res_rate
            })
            
        return results

analytics_engine = AnalyticsEngine()
