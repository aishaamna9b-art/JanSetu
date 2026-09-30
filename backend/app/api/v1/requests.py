from fastapi import APIRouter, Depends, Form, UploadFile, File, HTTPException, Body
from typing import Optional, List
from datetime import datetime, timezone
import uuid
from app.models.schemas import RequestResponse, RequestDetailResponse, TimelineItem
from app.core.security import get_current_user, require_role
from app.services.gemini_extract import extract_request_details
from app.core.firebase import get_db
from app.services.speech import transcribe_audio
from app.services.translation import translate_to_english
from app.services.tts import generate_tts_url
from app.services.storage import upload_file_to_storage
from app.services.embeddings import generate_embedding
from app.services.clustering import assign_to_cluster
from app.services.gemini_vision import analyze_photo
from app.config import settings
from app.data import local_db

router = APIRouter()

@router.post("", response_model=RequestResponse)
async def create_request(
    text: Optional[str] = Form(None),
    language: str = Form("en"),
    lat: Optional[float] = Form(None),
    lng: Optional[float] = Form(None),
    state: Optional[str] = Form(None),
    district: Optional[str] = Form(None),
    block: Optional[str] = Form(None),
    audio: Optional[UploadFile] = File(None),
    photo: Optional[UploadFile] = File(None),
    current_user: dict = Depends(require_role(["citizen"]))
):
    original_text = text or ""
    
    user_doc = local_db.get_user(current_user["uid"])
    if user_doc:
        address = user_doc.get("address", {})
        state = state or address.get("state")
        district = district or address.get("district")
        block = block or address.get("block")
    
    if audio:
        try:
            upload_file_to_storage(audio, folder="audio")
            audio_bytes = await audio.read()
            original_text = transcribe_audio(audio_bytes, language_code=language)
        except Exception as e:
            print(f"Error handling audio: {e}")
        
    photo_bytes = None
    photo_mime_type = None
    photo_url = None
    if photo:
        try:
            photo_bytes = await photo.read()
            photo_mime_type = photo.content_type
            await photo.seek(0)
            photo_url = upload_file_to_storage(photo, folder="photos")
        except Exception as e:
            print(f"Error handling photo: {e}")
        
    if not original_text:
        original_text = "No text provided"
        
    translated_text = translate_to_english(original_text)
    
    extraction = extract_request_details(translated_text)
    
    tracking_id = f"TRK-{uuid.uuid4().hex[:8].upper()}"
    req_id = f"req-{uuid.uuid4().hex[:12]}"
    
    embedding = generate_embedding(translated_text)
    photo_analysis = None
    photo_severity = 0.0
    if photo_bytes and photo_mime_type:
        try:
            photo_analysis_result = analyze_photo(photo_bytes, photo_mime_type, extraction.category)
            if photo_analysis_result:
                photo_analysis = photo_analysis_result.model_dump()
                photo_severity = float(photo_analysis_result.severity)
        except Exception as e:
            print(f"Photo analysis error: {e}")
            
    request_temp_data = {
        "location": {
            "lat": lat, "lng": lng,
            "state": state, "district": district, "block": block,
            "hint": extraction.location_hint
        },
        "category": extraction.category,
        "urgency": extraction.urgency,
        "original_text": original_text,
        "photo_severity": photo_severity
    }
    
    cluster_id = "cluster-default"
    try:
        cluster_id = assign_to_cluster(embedding, request_temp_data)
    except Exception as e:
        print(f"Cluster assignment error: {e}")
        cluster_id = f"cluster-{uuid.uuid4().hex[:8]}"
    
    if language != "en" and not settings.DEV_MODE:
        try:
            from google.cloud import translate_v2 as translate
            client = translate.Client()
            result = client.translate(f"Your request has been received. Tracking ID is {tracking_id}", target_language=language[:2])
            confirmation_message = result["translatedText"]
        except Exception as e:
            print(f"Confirmation translation error: {e}")
            confirmation_message = f"Your request has been received. Tracking ID is {tracking_id}"
    else:
        confirmation_message = f"Your request has been received. Tracking ID is {tracking_id}"
        
    confirmation_audio_url = ""
    try:
        confirmation_audio_url = generate_tts_url(confirmation_message, language_code=language)
    except Exception as e:
        print(f"TTS generation error: {e}")
    
    now = datetime.now(timezone.utc)
    
    request_doc = {
        "id": req_id,
        "tracking_id": tracking_id,
        "uid": current_user["uid"],
        "category": extraction.category,
        "sub_issue": extraction.sub_issue,
        "urgency": extraction.urgency,
        "sentiment": extraction.sentiment,
        "translated_text": translated_text,
        "original_text": original_text,
        "confirmation_message": confirmation_message,
        "status": "received",
        "language": language,
        "location": {
            "lat": lat, "lng": lng, 
            "state": state, "district": district, "block": block,
            "hint": extraction.location_hint
        },
        "vulnerable_group": extraction.vulnerable_group,
        "photo_url": photo_url,
        "photo_analysis": photo_analysis,
        "cluster_id": cluster_id,
        "created_at": now.isoformat(),
        "confirmation_audio_url": confirmation_audio_url
    }
    
    # Always persist locally to SQLite
    local_db.save_request(request_doc)
    
    # Also write to Firestore if available
    db = get_db()
    if db:
        try:
            req_ref = db.collection("requests").document(req_id)
            req_ref.set(request_doc)
            timeline_ref = req_ref.collection("timeline").document()
            timeline_ref.set({
                "status": "received",
                "timestamp": now.isoformat()
            })
        except Exception as e:
            print(f"Firestore save error (persisted to local DB): {e}")
    
    return RequestResponse(
        id=req_id,
        tracking_id=tracking_id,
        category=extraction.category,
        sub_issue=extraction.sub_issue,
        urgency=extraction.urgency,
        sentiment=extraction.sentiment,
        translated_text=translated_text,
        original_text=original_text,
        confirmation_message=confirmation_message,
        confirmation_audio_url=confirmation_audio_url,
        photo_url=photo_url,
        photo_analysis=photo_analysis,
        cluster_id=cluster_id,
        status="received"
    )

@router.get("/mine", response_model=List[RequestResponse])
def get_my_requests(current_user: dict = Depends(require_role(["citizen"]))):
    results = []
    
    # Try Firestore first if available
    db = get_db()
    if db:
        try:
            requests_query = db.collection("requests").where("uid", "==", current_user["uid"]).stream()
            for doc in requests_query:
                data = doc.to_dict()
                for key in ["location", "vulnerable_group", "created_at", "uid"]:
                    if key in data:
                        del data[key]
                results.append(RequestResponse(**data))
            if results:
                return results
        except Exception as e:
            print(f"Firestore query error: {e}")
            
    # Fetch from local persistent database
    local_rows = local_db.get_requests_for_user(current_user["uid"])
    for row in local_rows:
        cleaned = dict(row)
        for key in ["location", "vulnerable_group", "created_at", "uid", "district_code", "district", "state", "lat", "lng", "block"]:
            if key in cleaned:
                del cleaned[key]
        results.append(RequestResponse(**cleaned))
        
    return results

@router.get("/{tracking_id}", response_model=RequestDetailResponse)
def get_request_detail(tracking_id: str, current_user: dict = Depends(get_current_user)):
    request_data = None
    req_id = None
    timeline = []
    
    # Try Firestore if available
    db = get_db()
    if db:
        try:
            requests_query = db.collection("requests").where("tracking_id", "==", tracking_id).stream()
            for doc in requests_query:
                request_data = doc.to_dict()
                req_id = doc.id
                break
                
            if request_data:
                for key in ["location", "vulnerable_group", "created_at", "uid"]:
                    if key in request_data:
                        del request_data[key]
                timeline_docs = db.collection("requests").document(req_id).collection("timeline").order_by("timestamp").stream()
                for t_doc in timeline_docs:
                    t_data = t_doc.to_dict()
                    timeline.append(TimelineItem(status=t_data["status"], timestamp=t_data["timestamp"]))
                return RequestDetailResponse(
                    request_details=RequestResponse(**request_data),
                    timeline=timeline
                )
        except Exception as e:
            print(f"Firestore query error: {e}")

    # Fallback to local persistent DB
    local_data = local_db.get_request_by_tracking(tracking_id)
    if not local_data:
        raise HTTPException(status_code=404, detail="Request not found")
        
    req_id = local_data.get("id")
    cleaned = dict(local_data)
    for key in ["location", "vulnerable_group", "created_at", "uid", "district_code", "district", "state", "lat", "lng", "block"]:
        if key in cleaned:
            del cleaned[key]
            
    tl_items = local_db.get_timeline_for_request(req_id)
    for t_data in tl_items:
        timeline.append(TimelineItem(status=t_data["status"], timestamp=t_data["timestamp"]))
        
    return RequestDetailResponse(
        request_details=RequestResponse(**cleaned),
        timeline=timeline
    )

@router.patch("/{id}/status")
def update_request_status(
    id: str,
    status: str = Body(...),
    note: Optional[str] = Body(None),
    current_user: dict = Depends(require_role(["officer", "admin"]))
):
    now = datetime.now(timezone.utc)
    
    # Update local persistent database
    local_db.update_request(id, status, note)
    
    # Update Firestore if available
    db = get_db()
    if db:
        try:
            req_ref = db.collection("requests").document(id)
            doc = req_ref.get()
            if doc.exists:
                req_ref.update({"status": status})
                timeline_ref = req_ref.collection("timeline").document()
                timeline_data = {
                    "status": status,
                    "timestamp": now.isoformat()
                }
                if note:
                    timeline_data["note"] = note
                timeline_ref.set(timeline_data)
        except Exception as e:
            print(f"Firestore update error: {e}")
            
    return {"message": "Status updated successfully"}
