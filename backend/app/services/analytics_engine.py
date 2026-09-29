import pandas as pd
import sqlite3
import os
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.core.firebase import get_db

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(BASE_DIR, 'app', 'data', 'jansetu.db')

class AnalyticsEngine:
    def __init__(self):
        self.conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        
    def _get_firestore_requests(self) -> pd.DataFrame:
        db = get_db()
        if not db:
            try:
                return pd.read_sql_query("SELECT * FROM requests", self.conn)
            except Exception:
                return pd.DataFrame()
            
        docs = db.collection("requests").stream()
        records = []
        for doc in docs:
            d = doc.to_dict()
            loc = d.get('location', {})
            records.append({
                'id': d.get('id'),
                'category': d.get('category'),
                'district': loc.get('district'),
                'status': d.get('status'),
                'urgency': d.get('urgency'),
                'district_code': d.get('district_code')
            })
        return pd.DataFrame(records)
        
    def get_summary(self) -> Dict[str, Any]:
        req_df = self._get_firestore_requests()
        if req_df.empty:
            return {"total": 0, "completed": 0, "in_progress": 0, "received": 0, "top_categories": [], "trend": []}
            
        status_counts = req_df['status'].value_counts().to_dict()
        top_cats = req_df['category'].value_counts().head(5).to_dict()
        top_categories = [{"category": k, "count": v} for k, v in top_cats.items()]
        
        resolved = status_counts.get("completed", 0) + status_counts.get("funded", 0)
        res_rate = resolved / len(req_df) if len(req_df) > 0 else 0.0
        
        return {
            "total": len(req_df),
            "resolved_rate": res_rate,
            "top_categories": top_categories,
            "by_status": status_counts,
            "trend": [{"date": datetime.now(timezone.utc).isoformat()[:10], "count": len(req_df)}]
        }
        
    def get_gaps(self) -> List[Dict[str, Any]]:
        req_df = self._get_firestore_requests()
        if req_df.empty:
            return []
            
        demand = req_df.groupby(['district', 'category']).size().reset_index(name='demand_count')
        
        query = """
        SELECT d.district, i.category, i.index_score, d.population, p.allocated_cr, p.spent_cr
        FROM demographics d
        JOIN infra_index i ON d.district_code = i.district_code
        LEFT JOIN public_investment p ON d.district_code = p.district_code AND i.category = p.category
        """
        infra_df = pd.read_sql_query(query, self.conn)
        
        merged = pd.merge(demand, infra_df, on=['district', 'category'], how='inner')
        
        results = []
        for _, row in merged.iterrows():
            demand_per_lakh = (row['demand_count'] / row['population']) * 100000
            
            allocated = row['allocated_cr']
            if pd.isna(allocated) or allocated <= 0:
                spend_ratio = 0
            else:
                spend_ratio = row['spent_cr'] / allocated
                
            infra_idx = row['index_score']
            
            # gap_score = demand_per_lakh_population * (1 - infra_index) * (1 - spend_ratio)
            gap_score = demand_per_lakh * (1 - infra_idx) * (1 - spend_ratio)
            
            results.append({
                "district": row['district'],
                "category": row['category'],
                "demand_count": int(row['demand_count']),
                "infra_index": float(infra_idx),
                "spending": {"allocated_cr": float(allocated) if not pd.isna(allocated) else 0.0, "spent_cr": float(row['spent_cr']) if not pd.isna(row['spent_cr']) else 0.0},
                "gap_score": float(gap_score)
            })
            
        return sorted(results, key=lambda x: x["gap_score"], reverse=True)
        
    def get_hotspots(self) -> List[Dict[str, Any]]:
        gaps = self.get_gaps()
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
            df = pd.read_sql_query("SELECT * FROM dataset_metadata", self.conn)
            return df.to_dict('records')
        except Exception:
            return []
            
    def get_recommendations(self, district: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        gaps = self.get_gaps()
        recs = []
        for i, g in enumerate(gaps):
            if district and g["district"] != district: continue
            
            # Use real data logic for cost and people_served
            pop = g["population"]
            gap_pct = 1 - g["infra_index"]
            people_served = int(pop * gap_pct)
            
            # Simple assumption: e.g. 5000 Rs per person served
            cost_estimate = people_served * 5000 / 10000000 # in Cr
            
            recs.append({
                "project_id": f"proj-{i}",
                "cluster_id": f"cluster-{i}",
                "title": f"Enhance {g['category'].capitalize()} in {g['district']}",
                "category": g["category"],
                "region": g["district"],
                "people_served": people_served,
                "cost_estimate": max(0.5, round(cost_estimate, 2)),
                "priority_score": min(100.0, float(g["gap_score"])),
                "score_breakdown": {
                    "volume": float(g["demand_count"]),
                    "urgency": 4.0, # default/mock
                    "severity": 3.0, # default/mock
                    "infra_gap": gap_pct,
                    "population": float(pop)
                },
                "ai_justification": f"High demand ({g['demand_count']} requests) combined with low infrastructure coverage ({g['infra_index']}) in {g['district']} necessitates immediate {g['category']} investment."
            })
            
            if len(recs) >= limit:
                break
                
        return recs

    def get_impact(self, state: Optional[str] = None, district: Optional[str] = None) -> List[Dict[str, Any]]:
        req_df = self._get_firestore_requests()
        if req_df.empty:
            return []
            
        if district:
            req_df = req_df[req_df['district'] == district]
            
        if req_df.empty:
            return []
            
        districts = req_df['district'].unique()
        results = []
        
        for d in districts:
            d_df = req_df[req_df['district'] == d]
            raised = len(d_df)
            resolved = len(d_df[d_df['status'] == 'completed'])
            res_rate = resolved / raised if raised > 0 else 0.0
            
            results.append({
                "district": d,
                "raised": raised,
                "resolved": resolved,
                "resolution_rate": res_rate
            })
            
        return results

analytics_engine = AnalyticsEngine()
