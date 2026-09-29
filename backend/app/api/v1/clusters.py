from fastapi import APIRouter, Depends, HTTPException, Body
from app.core.security import require_role
from app.core.firebase import get_db

router = APIRouter()

@router.patch("/{id}")
def update_cluster(
    id: str,
    category: str = Body(..., embed=True),
    current_user: dict = Depends(require_role(["officer", "admin"]))
):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")
        
    cluster_ref = db.collection("clusters").document(id)
    doc = cluster_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Cluster not found")
        
    cluster_ref.update({
        "category": category
    })
    
    return {"message": "Cluster updated successfully"}
