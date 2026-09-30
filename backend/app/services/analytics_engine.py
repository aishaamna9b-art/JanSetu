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
            df = pd.DataFrame(records)
            if df.empty:
                # Fallback to local DB if firestore is empty
                return pd.read_sql_query("SELECT * FROM requests", self.conn)
            return df
        except Exception:
            return pd.read_sql_query("SELECT * FROM requests", self.conn)
        
    def get_summary(self, state: Optional[str] = None, district: Optional[str] = None) -> Dict[str, Any]:
        req_df = self._get_firestore_requests()
        if req_df.empty:
            return {"total": 0, "resolved_rate": 0.0, "top_categories": [], "by_status": {}, "trend": []}
            
        if state:
            if 'state' in req_df.columns:
                req_df = req_df[req_df['state'] == state]
            else:
                pass # Can't filter by state easily if not in db
        if district:
            req_df = req_df[req_df['district'] == district]
            
        if req_df.empty:
            return {"total": 0, "resolved_rate": 0.0, "top_categories": [], "by_status": {}, "trend": []}
            
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
        
    def get_gaps(self, state: Optional[str] = None, district: Optional[str] = None) -> List[Dict[str, Any]]:
        req_df = self._get_firestore_requests()
        if req_df.empty:
            return []
            
        if state and 'state' in req_df.columns:
            req_df = req_df[req_df['state'] == state]
            
        if district and 'district' in req_df.columns:
            req_df = req_df[req_df['district'] == district]
            
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
        merged = merged.fillna({
            'population': 100000.0,
            'allocated_cr': 0.0,
            'spent_cr': 0.0,
            'index_score': 0.5,
        })
        
        results = []
        for _, row in merged.iterrows():
            demand_per_lakh = (row['demand_count'] / row['population']) * 100000
            
            allocated = row['allocated_cr']
            if pd.isna(allocated) or allocated <= 0:
                spend_ratio = 0
            else:
                spend_ratio = row['spent_cr'] / allocated
                
            infra_idx = row['index_score']
            
            gap_score = demand_per_lakh * (1 - infra_idx) * (1 - spend_ratio)
            
            results.append({
                "district": row['district'],
                "category": row['category'],
                "demand_count": int(row['demand_count']),
                "infra_index": float(infra_idx),
                "population": float(row['population']), # Added to fix KeyError
                "spending": {"allocated_cr": float(allocated) if not pd.isna(allocated) else 0.0, "spent_cr": float(row['spent_cr']) if not pd.isna(row['spent_cr']) else 0.0},
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
            df = pd.read_sql_query("SELECT * FROM dataset_metadata", self.conn)
            return df.to_dict('records')
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
        req_df = self._get_firestore_requests()
        if req_df.empty:
            return []
            
        if district:
            req_df = req_df[req_df['district'] == district]
            
        if req_df.empty:
            return []
            
        req_df['district'] = req_df['district'].fillna('Unknown')
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
