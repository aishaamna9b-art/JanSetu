import os
import random
import uuid
import pandas as pd
from datetime import datetime, timedelta, timezone
from app.core.firebase import init_firebase, get_db

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'app', 'data', 'datasets')

CATEGORIES = ['water', 'roads', 'electricity', 'health', 'education', 'sanitation', 'housing', 'agriculture', 'transport', 'other']
STATUSES = ['received', 'in_progress', 'completed']

def seed_requests():
    random.seed(1234)
    
    demo_df = pd.read_csv(os.path.join(DATA_DIR, 'demographics.csv'))
    infra_df = pd.read_csv(os.path.join(DATA_DIR, 'infra_index.csv'))
    
    total_pop = demo_df['population'].sum()
    target_total = 4000
    
    # Select 5 districts for spikes
    spike_districts = demo_df.sample(5, random_state=42)['district_code'].tolist()
    
    requests_to_insert = []
    
    now = datetime.now(timezone.utc)
    
    for _, row in demo_df.iterrows():
        dcode = row['district_code']
        district = row['district']
        state = row['state']
        pop = row['population']
        
        # Base count proportional to population
        base_count = int((pop / total_pop) * target_total)
        if base_count < 5:
            base_count = 5
            
        is_spike = dcode in spike_districts
        spike_cats = random.sample(CATEGORIES, 2) if is_spike else []
        
        for _ in range(base_count):
            cat = random.choice(CATEGORIES)
            if is_spike and random.random() < 0.6:
                cat = random.choice(spike_cats)
                
            status = random.choices(STATUSES, weights=[0.2, 0.3, 0.5])[0]
            urgency = random.randint(1, 5)
            
            created_at = now - timedelta(days=random.randint(0, 60), hours=random.randint(0, 23))
            
            req_id = f"req-{uuid.uuid4().hex[:12]}"
            
            requests_to_insert.append({
                "id": req_id,
                "tracking_id": f"TRK-{uuid.uuid4().hex[:8].upper()}",
                "uid": "dev-cit-1",
                "category": cat,
                "sub_issue": f"Issue related to {cat}",
                "urgency": urgency,
                "sentiment": random.choice(["negative", "neutral", "highly_negative"]),
                "translated_text": f"This is a {cat} issue in {district}.",
                "original_text": f"This is a {cat} issue in {district}.",
                "status": status,
                "language": random.choice(["en", "hi", "ta"]),
                "location": {
                    "lat": 20.0 + random.uniform(-2, 2),
                    "lng": 78.0 + random.uniform(-2, 2),
                    "state": state,
                    "district": district,
                    "hint": f"Near {district} center"
                },
                "created_at": created_at.isoformat(),
                "district_code": int(dcode)
            })
            
    print(f"Generated {len(requests_to_insert)} requests. Uploading to Firestore...")
    
    init_firebase()
    db = get_db()
    if not db:
        print("Firestore not initialized. Using SQLite fallback...")
        req_df = pd.DataFrame(requests_to_insert)
        # flatten location
        req_df['district'] = req_df['location'].apply(lambda x: x.get('district'))
        req_df['state'] = req_df['location'].apply(lambda x: x.get('state'))
        req_df['lat'] = req_df['location'].apply(lambda x: x.get('lat'))
        req_df['lng'] = req_df['location'].apply(lambda x: x.get('lng'))
        req_df.drop(columns=['location'], inplace=True)
        
        import sqlite3
        conn = sqlite3.connect(os.path.join(BASE_DIR, 'app', 'data', 'jansetu.db'))
        req_df.to_sql('requests', conn, if_exists='replace', index=False)
        conn.close()
        print(f"Successfully seeded {len(requests_to_insert)} requests to SQLite.")
        return
        
    batch = db.batch()
    count = 0
    for req in requests_to_insert:
        doc_ref = db.collection("requests").document(req["id"])
        batch.set(doc_ref, req)
        count += 1
        if count % 400 == 0:
            batch.commit()
            print(f"Committed {count} records")
            batch = db.batch()
            
    if count % 400 != 0:
        batch.commit()
        
    print(f"Successfully seeded {count} requests.")

if __name__ == '__main__':
    seed_requests()
