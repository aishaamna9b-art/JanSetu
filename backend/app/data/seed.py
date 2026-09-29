import json
import random
import uuid
import csv
from datetime import datetime, timedelta, timezone
from pathlib import Path
import os
import sys

# Add parent directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.firebase import init_firebase, get_db

CATEGORIES = ["water", "roads", "electricity", "health", "education", "sanitation", "housing", "agriculture", "transport", "other"]
STATUSES = ["received", "verified", "under_review", "funded", "completed", "rejected"]
LANGUAGES = ["en", "hi", "ta"]

STATES_DISTRICTS = {
    "Delhi": ["North West Delhi", "South Delhi"],
    "Maharashtra": ["Mumbai Suburban", "Pune"]
}
BLOCKS = {
    "North West Delhi": ["Rohini", "Pitampura", "Shalimar Bagh"],
    "South Delhi": ["Saket", "Hauz Khas", "Vasant Kunj"],
    "Mumbai Suburban": ["Andheri", "Bandra", "Borivali"],
    "Pune": ["Kothrud", "Shivajinagar", "Hadapsar"]
}
COORDINATES = {
    "North West Delhi": (28.7041, 77.1025),
    "South Delhi": (28.5244, 77.1855),
    "Mumbai Suburban": (19.1245, 72.8407),
    "Pune": (18.5204, 73.8567)
}

def generate_requests(num=400):
    requests = []
    clusters = {}
    
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=30)
    
    for i in range(num):
        state = random.choice(list(STATES_DISTRICTS.keys()))
        district = random.choice(STATES_DISTRICTS[state])
        block = random.choice(BLOCKS[district])
        category = random.choice(CATEGORIES)
        
        # Simulate hotspots by giving higher probability to some combinations
        if random.random() < 0.2:
            district = "North West Delhi"
            block = "Rohini"
            category = "water"
            
        base_lat, base_lng = COORDINATES[district]
        lat = base_lat + random.uniform(-0.05, 0.05)
        lng = base_lng + random.uniform(-0.05, 0.05)
        
        req_id = f"req-{uuid.uuid4().hex[:12]}"
        
        # Simple clustering based on category and district
        cluster_key = f"{district}-{category}"
        if cluster_key not in clusters:
            clusters[cluster_key] = f"cluster-{uuid.uuid4().hex[:8]}"
            
        timestamp = start_date + timedelta(seconds=random.randint(0, int((end_date - start_date).total_seconds())))
        
        requests.append({
            "id": req_id,
            "tracking_id": f"TRK-{uuid.uuid4().hex[:8].upper()}",
            "uid": f"user-{random.randint(1, 100)}",
            "category": category,
            "sub_issue": f"issue_{random.randint(1, 5)}",
            "urgency": random.randint(1, 5),
            "sentiment": random.choice(["neutral", "frustrated", "angry", "hopeful"]),
            "translated_text": f"Generated request about {category} in {block}",
            "original_text": f"Generated request about {category} in {block}",
            "confirmation_message": "Received",
            "status": random.choices(STATUSES, weights=[20, 30, 15, 10, 20, 5])[0],
            "language": random.choice(LANGUAGES),
            "location": {
                "lat": lat, "lng": lng,
                "state": state, "district": district, "block": block,
                "hint": block
            },
            "vulnerable_group": random.choice([True, False]),
            "cluster_id": clusters[cluster_key],
            "created_at": timestamp.isoformat()
        })
        
    return requests, clusters

def generate_csvs(data_dir: Path):
    seed_dir = data_dir / "seed"
    seed_dir.mkdir(exist_ok=True)
    
    # Demographics
    with open(seed_dir / "demographics.csv", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["state", "district", "block", "population", "vulnerable_pop"])
        for state, dists in STATES_DISTRICTS.items():
            for dist in dists:
                for block in BLOCKS[dist]:
                    writer.writerow([state, dist, block, random.randint(50000, 200000), random.randint(5000, 30000)])
                    
    # Infra index
    with open(seed_dir / "infra_index.csv", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["district", "block", "category", "infra_index"])
        for state, dists in STATES_DISTRICTS.items():
            for dist in dists:
                for block in BLOCKS[dist]:
                    for cat in CATEGORIES:
                        writer.writerow([dist, block, cat, round(random.uniform(0.1, 0.9), 2)])
                        
    # Public spending
    with open(seed_dir / "public_spending.csv", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["district", "block", "category", "spending"])
        for state, dists in STATES_DISTRICTS.items():
            for dist in dists:
                for block in BLOCKS[dist]:
                    for cat in CATEGORIES:
                        writer.writerow([dist, block, cat, random.randint(100000, 5000000)])

def main():
    print("Generating seed data...")
    data_dir = Path(__file__).parent
    
    requests, clusters = generate_requests(400)
    
    with open(data_dir / "seed_requests.json", "w") as f:
        json.dump(requests, f, indent=2)
        
    print(f"Generated {len(requests)} requests and saved to seed_requests.json")
    
    generate_csvs(data_dir)
    print("Generated CSVs in seed/")
    
    # Try pushing to Firestore
    init_firebase()
    db = get_db()
    if db:
        print("Pushing to Firestore (this may take a minute)...")
        batch = db.batch()
        count = 0
        
        # We need to create clusters first
        for cluster_key, cluster_id in clusters.items():
            district, category = cluster_key.split("-")
            cluster_ref = db.collection("clusters").document(cluster_id)
            # Find a request for lat/lng
            example_req = next((r for r in requests if r["cluster_id"] == cluster_id), None)
            batch.set(cluster_ref, {
                "cluster_id": cluster_id,
                "category": category,
                "district": district,
                "block": example_req["location"]["block"] if example_req else "Unknown",
                "lat": example_req["location"]["lat"] if example_req else 0,
                "lng": example_req["location"]["lng"] if example_req else 0,
                "count": sum(1 for r in requests if r["cluster_id"] == cluster_id),
                "priority_score": round(random.uniform(0.3, 0.95), 2),
                "example_text": example_req["original_text"] if example_req else ""
            })
            count += 1
            if count % 400 == 0:
                batch.commit()
                batch = db.batch()
                
        for req in requests:
            req_ref = db.collection("requests").document(req["id"])
            batch.set(req_ref, req)
            timeline_ref = req_ref.collection("timeline").document()
            batch.set(timeline_ref, {
                "status": "received",
                "timestamp": req["created_at"]
            })
            count += 2
            if count >= 400:
                batch.commit()
                batch = db.batch()
                count = 0
                
        if count > 0:
            batch.commit()
            
        print("Successfully seeded Firestore.")
    else:
        print("DEV_MODE is enabled or Firebase credentials not found. Skipped Firestore push.")

if __name__ == "__main__":
    main()
