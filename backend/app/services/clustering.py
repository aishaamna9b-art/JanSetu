import uuid
import numpy as np
from app.core.firebase import get_db
from app.services.scoring import calculate_priority_score

SIMILARITY_THRESHOLD = 0.85

def cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    v1 = np.array(vec1)
    v2 = np.array(vec2)
    
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
        
    return np.dot(v1, v2) / (norm1 * norm2)

def assign_to_cluster(
    embedding: list[float], 
    request_data: dict
) -> str:
    """
    Finds a similar cluster or creates a new one. Returns the cluster ID.
    request_data contains: district, block, category, urgency, etc.
    """
    db = get_db()
    if not db:
        return f"cluster-dev-{uuid.uuid4().hex[:8]}"
        
    district = request_data.get("location", {}).get("district", "")
    block = request_data.get("location", {}).get("block", "")
    category = request_data.get("category", "")
    urgency = request_data.get("urgency", 3)
    
    try:
        clusters_ref = db.collection("clusters")
        query = clusters_ref.where("district", "==", district).where("category", "==", category)
        
        best_cluster_id = None
        best_sim = -1.0
        best_cluster_data = None
        
        for doc in query.stream():
            c_data = doc.to_dict()
            c_emb = c_data.get("centroid_embedding")
            if c_emb:
                sim = cosine_similarity(embedding, c_emb)
                if sim > best_sim:
                    best_sim = sim
                    best_cluster_id = doc.id
                    best_cluster_data = c_data
    except Exception as e:
        print(f"Error querying clusters from Firestore: {e}")
        return f"cluster-dev-{uuid.uuid4().hex[:8]}"
                
    if best_sim >= SIMILARITY_THRESHOLD and best_cluster_id:
        # Attach to existing cluster
        count = best_cluster_data.get("count", 0) + 1
        
        # update running averages
        old_urgency = best_cluster_data.get("urgency_avg", 3.0)
        new_urgency = ((old_urgency * (count - 1)) + urgency) / count
        
        req_photo_severity = request_data.get("photo_severity", 0.0)
        old_photo_severity = best_cluster_data.get("photo_severity_avg", 0.0)
        
        if req_photo_severity > 0:
            # only average in if the new request actually has a photo
            # alternatively, just treat 0 as "no photo" and average it in.
            # Usually it's better to average over the number of requests that HAVE photos, 
            # but for simplicity and since we use 0.0 as default, let's just do a normal moving average
            pass
            
        new_photo_severity = ((old_photo_severity * (count - 1)) + req_photo_severity) / count
        
        # Calculate new priority
        score_res = calculate_priority_score(
            count=count,
            urgency_avg=new_urgency,
            photo_severity_avg=new_photo_severity,
            district=district,
            block=block,
            category=category
        )
        
        # Update centroid by moving it slightly towards new point
        old_centroid = np.array(best_cluster_data["centroid_embedding"])
        new_emb = np.array(embedding)
        new_centroid = ((old_centroid * (count - 1)) + new_emb) / count
        
        clusters_ref.document(best_cluster_id).update({
            "count": count,
            "urgency_avg": new_urgency,
            "photo_severity_avg": new_photo_severity,
            "priority_score": score_res["score"],
            "score_breakdown": score_res["breakdown"],
            "centroid_embedding": new_centroid.tolist()
        })
        
        return best_cluster_id
        
    else:
        # Create new cluster
        new_cluster_id = f"cluster-{uuid.uuid4().hex[:8]}"
        
        req_photo_severity = request_data.get("photo_severity", 0.0)
        
        score_res = calculate_priority_score(
            count=1,
            urgency_avg=float(urgency),
            photo_severity_avg=req_photo_severity,
            district=district,
            block=block,
            category=category
        )
        
        clusters_ref.document(new_cluster_id).set({
            "cluster_id": new_cluster_id,
            "category": category,
            "district": district,
            "block": block,
            "lat": request_data.get("location", {}).get("lat", 0.0),
            "lng": request_data.get("location", {}).get("lng", 0.0),
            "count": 1,
            "urgency_avg": float(urgency),
            "photo_severity_avg": req_photo_severity,
            "priority_score": score_res["score"],
            "score_breakdown": score_res["breakdown"],
            "centroid_embedding": embedding,
            "example_text": request_data.get("original_text", "")
        })
        
        return new_cluster_id
