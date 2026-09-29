from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Body
from app.core.security import require_role
from app.core.firebase import get_db

router = APIRouter()

@router.post("/datasets")
def upload_dataset(
    type: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(require_role(["admin"]))
):
    if type not in ["demographics", "infra_index", "public_spending"]:
        raise HTTPException(status_code=400, detail="Invalid dataset type")
        
    return {"message": f"{type} dataset uploaded successfully"}

@router.post("/regions")
def add_region(
    state: str = Body(...),
    district: str = Body(...),
    current_user: dict = Depends(require_role(["admin"]))
):
    # In a real app, you would add these to a metadata collection
    return {"message": "Region added successfully"}

@router.get("/users")
def get_users(current_user: dict = Depends(require_role(["admin"]))):
    # Mocking users since Firebase Admin SDK auth.list_users() is typically used here
    return [
        {"uid": "mock-admin", "email": "admin@jansetu.gov", "role": "admin"},
        {"uid": "mock-officer", "email": "officer@jansetu.gov", "role": "officer"},
    ]

@router.patch("/users")
def update_user_role(
    uid: str = Body(...),
    role: str = Body(...),
    current_user: dict = Depends(require_role(["admin"]))
):
    if role not in ["citizen", "officer", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    return {"message": f"User {uid} updated to {role}"}
