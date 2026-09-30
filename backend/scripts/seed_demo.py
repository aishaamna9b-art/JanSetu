import os
import sys
import uuid
import random
from datetime import datetime, timedelta, timezone

# Add the parent directory to sys.path so we can import 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.data.local_db import save_user, save_request, get_connection
from app.models.schemas import UserProfileSchema, PersonalDetailsSchema, ContactDetailsSchema, AddressDetailsSchema, PreferencesSchema

def get_random_date(days_back=30):
    return datetime.now(timezone.utc) - timedelta(days=random.randint(0, days_back), hours=random.randint(0, 23))

def seed_data():
    citizens = [
        {
            "uid": "dev-citizen-1",
            "name": "Ramesh Kumar",
            "mobile": "9876543210",
            "lang": "hi",
            "district": "Patna",
            "state": "Bihar",
            "block": "Patna Rural"
        },
        {
            "uid": "dev-citizen-2",
            "name": "Lakshmi Devi",
            "mobile": "9988776655",
            "lang": "ta",
            "district": "Chennai",
            "state": "Tamil Nadu",
            "block": "Chennai City"
        },
        {
            "uid": "dev-citizen-3",
            "name": "Arjun Singh",
            "mobile": "9123456789",
            "lang": "en",
            "district": "Lucknow",
            "state": "Uttar Pradesh",
            "block": "Lucknow East"
        }
    ]
    
    categories = ["Water Supply", "Roads", "Electricity", "Healthcare", "Education", "Sanitation"]
    statuses = ["received", "in_progress", "verified", "completed", "rejected"]
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM requests;")
    cursor.execute("DELETE FROM users;")
    cursor.execute("DELETE FROM timeline;")
    conn.commit()
    conn.close()

    for c in citizens:
        profile = UserProfileSchema(
            uid=c["uid"],
            role="citizen",
            profile_complete=True,
            personal=PersonalDetailsSchema(full_name=c["name"], relation_type="father", relation_name="X", dob="1980-01-01", gender="male"),
            contact=ContactDetailsSchema(mobile=c["mobile"]),
            address=AddressDetailsSchema(house_no="12", village_or_ward="Ward 1", pincode="110001", block=c["block"], district=c["district"], state=c["state"]),
            preferences=PreferencesSchema(language=c["lang"]),
            consent_given=True,
            declaration_accepted=True,
            registration_id=f"JS-{c['state'][:2].upper()}-2026-{random.randint(100000, 999999)}"
        )
        save_user(c["uid"], profile.model_dump())
        
        for i in range(random.randint(8, 12)):
            req_id = f"req-{uuid.uuid4().hex[:12]}"
            tracking_id = f"TRK-{uuid.uuid4().hex[:8].upper()}"
            cat = random.choice(categories)
            status = random.choice(statuses)
            created_at = get_random_date()
            
            req_doc = {
                "id": req_id,
                "tracking_id": tracking_id,
                "uid": c["uid"],
                "category": cat,
                "sub_issue": "General",
                "urgency": random.randint(1, 5),
                "sentiment": "neutral",
                "translated_text": f"Fix {cat} problem",
                "original_text": f"Fix {cat} problem",
                "status": status,
                "language": c["lang"],
                "created_at": created_at.isoformat(),
                "location": {
                    "district": c["district"],
                    "state": c["state"],
                    "block": c["block"],
                    "lat": 20.0,
                    "lng": 80.0
                },
                "cluster_id": "cluster-default"
            }
            save_request(req_doc)
            
            # Add timeline items
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("UPDATE requests SET status = ? WHERE id = ?", (status, req_id))
            if status != "received":
                cursor.execute("INSERT INTO timeline (request_id, status, timestamp, note) VALUES (?, ?, ?, ?)", (req_id, status, (created_at + timedelta(days=1)).isoformat(), "Updated"))
            conn.commit()
            conn.close()

if __name__ == "__main__":
    seed_data()
    print("Demo data seeded.")
