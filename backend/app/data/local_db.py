import sqlite3
import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'data', 'jansetu.db')

def get_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_tables():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check existing columns in requests
    cursor.execute("PRAGMA table_info(requests);")
    existing_cols = {row["name"] for row in cursor.fetchall()}
    
    additional_cols = [
        ("block", "TEXT"),
        ("confirmation_message", "TEXT"),
        ("confirmation_audio_url", "TEXT"),
        ("photo_url", "TEXT"),
        ("cluster_id", "TEXT"),
        ("photo_analysis", "TEXT"),
        ("vulnerable_group", "INTEGER")
    ]
    
    for col_name, col_type in additional_cols:
        if col_name not in existing_cols:
            try:
                cursor.execute(f"ALTER TABLE requests ADD COLUMN {col_name} {col_type};")
            except Exception as e:
                pass
                
    # Create timeline table if not exists
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS timeline (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id TEXT NOT NULL,
        status TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        note TEXT
    );
    """)
    
    # Create clusters table if not exists
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS clusters (
        cluster_id TEXT PRIMARY KEY,
        category TEXT,
        district TEXT,
        block TEXT,
        lat REAL,
        lng REAL,
        count INTEGER DEFAULT 1,
        urgency_avg REAL DEFAULT 3.0,
        photo_severity_avg REAL DEFAULT 0.0,
        priority_score REAL DEFAULT 0.5,
        example_text TEXT,
        created_at TEXT
    );
    """)
    
    conn.commit()
    conn.close()

# Initialize tables immediately upon import
init_tables()

def save_request(req_doc: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    
    loc = req_doc.get("location", {}) or {}
    photo_str = json.dumps(req_doc.get("photo_analysis")) if req_doc.get("photo_analysis") else None
    
    cursor.execute("""
    INSERT OR REPLACE INTO requests (
        id, tracking_id, uid, category, sub_issue, urgency, sentiment,
        translated_text, original_text, status, language, created_at,
        district, state, block, lat, lng,
        confirmation_message, confirmation_audio_url, photo_url, cluster_id,
        photo_analysis, vulnerable_group
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        req_doc.get("id"),
        req_doc.get("tracking_id"),
        req_doc.get("uid"),
        req_doc.get("category"),
        req_doc.get("sub_issue"),
        req_doc.get("urgency", 3),
        req_doc.get("sentiment", "neutral"),
        req_doc.get("translated_text"),
        req_doc.get("original_text"),
        req_doc.get("status", "received"),
        req_doc.get("language", "en"),
        req_doc.get("created_at") or datetime.now(timezone.utc).isoformat(),
        loc.get("district"),
        loc.get("state"),
        loc.get("block"),
        loc.get("lat"),
        loc.get("lng"),
        req_doc.get("confirmation_message"),
        req_doc.get("confirmation_audio_url"),
        req_doc.get("photo_url"),
        req_doc.get("cluster_id"),
        photo_str,
        1 if req_doc.get("vulnerable_group") else 0
    ))
    
    # Add initial timeline event
    cursor.execute("""
    INSERT INTO timeline (request_id, status, timestamp, note)
    VALUES (?, ?, ?, ?)
    """, (
        req_doc.get("id"),
        "received",
        req_doc.get("created_at") or datetime.now(timezone.utc).isoformat(),
        "Complaint registered"
    ))
    
    conn.commit()
    conn.close()

def get_request_by_tracking(tracking_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM requests WHERE tracking_id = ? OR id = ? LIMIT 1", (tracking_id, tracking_id))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
        
    d = dict(row)
    if d.get("photo_analysis"):
        try:
            d["photo_analysis"] = json.loads(d["photo_analysis"])
        except Exception:
            d["photo_analysis"] = None
    else:
        d["photo_analysis"] = None
        
    conn.close()
    return d

def get_timeline_for_request(request_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT status, timestamp, note FROM timeline WHERE request_id = ? ORDER BY timestamp ASC", (request_id,))
    rows = cursor.fetchall()
    conn.close()
    if rows:
        return [dict(r) for r in rows]
    return [{"status": "received", "timestamp": datetime.now(timezone.utc).isoformat(), "note": "Complaint registered"}]

def get_requests_for_user(uid: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM requests WHERE uid = ? ORDER BY created_at DESC", (uid,))
    rows = cursor.fetchall()
    conn.close()
    results = []
    for r in rows:
        d = dict(r)
        if d.get("photo_analysis"):
            try:
                d["photo_analysis"] = json.loads(d["photo_analysis"])
            except Exception:
                d["photo_analysis"] = None
        else:
            d["photo_analysis"] = None
        results.append(d)
    return results

def update_request(req_id: str, status: str, note: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    cursor.execute("UPDATE requests SET status = ? WHERE id = ? OR tracking_id = ?", (status, req_id, req_id))
    cursor.execute("INSERT INTO timeline (request_id, status, timestamp, note) VALUES (?, ?, ?, ?)", (req_id, status, now, note))
    conn.commit()
    conn.close()
