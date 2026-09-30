from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Any, Dict
from datetime import datetime, timezone
import random
from app.models.schemas import UserProfileSchema, PersonalDetailsSchema, ContactDetailsSchema, AddressDetailsSchema, PreferencesSchema
from app.core.security import require_role
from app.data import local_db
from pydantic import ValidationError

router = APIRouter()

def is_valid_string(s: Any) -> bool:
    if not isinstance(s, str): return False
    s = s.strip()
    if not s or s.lower() == "partial name": return False
    return True

def check_profile_complete(profile: UserProfileSchema) -> bool:
    if not is_valid_string(profile.personal.full_name): return False
    if not is_valid_string(profile.personal.relation_name): return False
    if not is_valid_string(profile.personal.dob): return False
    if not is_valid_string(profile.personal.gender): return False
    if not is_valid_string(profile.contact.mobile): return False
    if not is_valid_string(profile.address.house_no): return False
    if not is_valid_string(profile.address.village_or_ward): return False
    if not is_valid_string(profile.address.pincode): return False
    if not is_valid_string(profile.address.block): return False
    if not is_valid_string(profile.address.district): return False
    if not is_valid_string(profile.address.state): return False
    if not is_valid_string(profile.preferences.language): return False
    if not profile.consent_given: return False
    if not profile.declaration_accepted: return False
    return True

@router.get("/me", response_model=UserProfileSchema)
def get_me(current_user: dict = Depends(require_role(["citizen"]))):
    uid = current_user["uid"]
    profile_doc = local_db.get_user(uid)
    if not profile_doc:
        profile = UserProfileSchema(
            uid=uid,
            contact=ContactDetailsSchema(mobile=current_user.get("phone", ""))
        )
        profile_doc = profile.model_dump()
        local_db.save_user(uid, profile_doc)
        return profile

    try:
        return UserProfileSchema(**profile_doc)
    except ValidationError:
        raise HTTPException(status_code=500, detail="Invalid profile data stored")

@router.patch("/me", response_model=UserProfileSchema)
def update_me(
    update_data: dict = Body(...),
    current_user: dict = Depends(require_role(["citizen"]))
):
    uid = current_user["uid"]
    profile_doc = local_db.get_user(uid)
    if not profile_doc:
        profile = UserProfileSchema(uid=uid, contact=ContactDetailsSchema(mobile=current_user.get("phone", "")))
        profile_doc = profile.model_dump()

    readonly_errors = {}
    is_signed_up = profile_doc.get("profile_complete", False)
    
    if is_signed_up:
        if "contact" in update_data and "mobile" in update_data["contact"]:
            if profile_doc.get("contact", {}).get("mobile") != update_data["contact"]["mobile"]:
                readonly_errors["contact.mobile"] = "Mobile number cannot be changed after signup"
                
        if "registration_id" in update_data:
            if profile_doc.get("registration_id") != update_data["registration_id"]:
                readonly_errors["registration_id"] = "Registration ID cannot be modified"
                
    if readonly_errors:
        raise HTTPException(status_code=422, detail={
            "error": {
                "code": "validation_error",
                "message": "Read-only fields cannot be modified",
                "fields": readonly_errors
            }
        })

    if "personal" in update_data:
        if "personal" not in profile_doc: profile_doc["personal"] = {}
        profile_doc["personal"].update(update_data["personal"])
    if "contact" in update_data:
        if "contact" not in profile_doc: profile_doc["contact"] = {}
        profile_doc["contact"].update(update_data["contact"])
    if "address" in update_data:
        if "address" not in profile_doc: profile_doc["address"] = {}
        profile_doc["address"].update(update_data["address"])
    if "preferences" in update_data:
        if "preferences" not in profile_doc: profile_doc["preferences"] = {}
        profile_doc["preferences"].update(update_data["preferences"])
    if "id_proof" in update_data:
        if "id_proof" not in profile_doc: profile_doc["id_proof"] = {}
        if update_data["id_proof"]:
            profile_doc["id_proof"].update(update_data["id_proof"])
        else:
            profile_doc["id_proof"] = None
            
    for key in ["occupation", "is_differently_abled", "consent_given", "declaration_accepted"]:
        if key in update_data:
            profile_doc[key] = update_data[key]

    try:
        updated_profile = UserProfileSchema(**profile_doc)
    except ValidationError as e:
        errors = {}
        for err in e.errors():
            loc = ".".join([str(x) for x in err["loc"]])
            errors[loc] = err["msg"]
        raise HTTPException(status_code=422, detail={
            "error": {
                "code": "validation_error",
                "message": "Validation failed",
                "fields": errors
            }
        })

    updated_profile.profile_complete = check_profile_complete(updated_profile)
    
    if updated_profile.profile_complete and not updated_profile.registration_id:
        state_code = updated_profile.address.state[:2].upper() if updated_profile.address.state else "XX"
        year = datetime.now(timezone.utc).year
        random_digits = f"{random.randint(0, 999999):06d}"
        updated_profile.registration_id = f"JS-{state_code}-{year}-{random_digits}"

    updated_profile.updated_at = datetime.now(timezone.utc).isoformat()
    
    local_db.save_user(uid, updated_profile.model_dump())
    return updated_profile

@router.get("/me/stats")
def get_me_stats(current_user: dict = Depends(require_role(["citizen"]))):
    requests = local_db.get_requests_for_user(current_user["uid"])
    total = len(requests)
    resolved = len([r for r in requests if r.get("status") in ("completed", "verified", "funded")])
    pending = total - resolved
    
    by_cat = {}
    for r in requests:
        cat = r.get("category", "Other")
        by_cat[cat] = by_cat.get(cat, 0) + 1
        
    by_category = [{"category": k, "count": v} for k, v in by_cat.items()]
    
    return {
        "total": total,
        "resolved": resolved,
        "pending": pending,
        "by_category": by_category
    }
