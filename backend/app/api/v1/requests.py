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

router = APIRouter()

# Global in-memory mock DB for when Firebase is not configured
MOCK_DB = {
    "requests": {},
    "timelines": {}
}

@router.post("", response_model=RequestResponse)
async def create_request(
    text: Optional[str] = Form(None),
    language: str = Form(...),
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
    
    if audio:
        upload_file_to_storage(audio, folder="audio")
        audio_bytes = await audio.read()
        original_text = transcribe_audio(audio_bytes, language_code=language)
        
    photo_bytes = None
    photo_mime_type = None
    if photo:
        photo_bytes = await photo.read()
        photo_mime_type = photo.content_type
        await photo.seek(0)
        upload_file_to_storage(photo, folder="photos")
        
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
        photo_analysis_result = analyze_photo(photo_bytes, photo_mime_type, extraction.category)
        if photo_analysis_result:
            photo_analysis = photo_analysis_result.model_dump()
            photo_severity = float(photo_analysis_result.severity)
            
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
    cluster_id = assign_to_cluster(embedding, request_temp_data)
    
    if language != "en" and not settings.DEV_MODE:
        from google.cloud import translate_v2 as translate
        client = translate.Client()
        result = client.translate(f"Your request has been received. Tracking ID is {tracking_id}", target_language=language[:2])
        confirmation_message = result["translatedText"]
    else:
        confirmation_message = f"Your request has been received. Tracking ID is {tracking_id}"
        
    confirmation_audio_url = generate_tts_url(confirmation_message, language_code=language)
    
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
        "photo_analysis": photo_analysis,
        "cluster_id": cluster_id,
        "created_at": now.isoformat(),
        "confirmation_audio_url": confirmation_audio_url
    }
    
    db = get_db()
    if db:
        req_ref = db.collection("requests").document(req_id)
        req_ref.set(request_doc)
        
        timeline_ref = req_ref.collection("timeline").document()
        timeline_ref.set({
            "status": "received",
            "timestamp": now.isoformat()
        })
    else:
        MOCK_DB["requests"][req_id] = request_doc
        MOCK_DB["timelines"][req_id] = [{
            "status": "received",
            "timestamp": now.isoformat()
        }]
    
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
        photo_analysis=photo_analysis,
        cluster_id=cluster_id,
        status="received"
    )

@router.get("/mine", response_model=List[RequestResponse])
def get_my_requests(current_user: dict = Depends(require_role(["citizen"]))):
    db = get_db()
    results = []
    
    if db:
        requests_query = db.collection("requests").where("uid", "==", current_user["uid"]).stream()
        for doc in requests_query:
            data = doc.to_dict()
            for key in ["location", "vulnerable_group", "created_at", "uid"]:
                if key in data:
                    del data[key]
            results.append(RequestResponse(**data))
    else:
        for req_id, data in MOCK_DB["requests"].items():
            if data["uid"] == current_user["uid"]:
                cleaned_data = data.copy()
                for key in ["location", "vulnerable_group", "created_at", "uid"]:
                    if key in cleaned_data:
                        del cleaned_data[key]
                results.append(RequestResponse(**cleaned_data))
                
    return results

@router.get("/{tracking_id}", response_model=RequestDetailResponse)
def get_request_detail(tracking_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    request_data = None
    req_id = None
    timeline = []
    
    if db:
        requests_query = db.collection("requests").where("tracking_id", "==", tracking_id).stream()
        for doc in requests_query:
            request_data = doc.to_dict()
            req_id = doc.id
            break
            
        if not request_data:
            raise HTTPException(status_code=404, detail="Request not found")
            
        for key in ["location", "vulnerable_group", "created_at", "uid"]:
            if key in request_data:
                del request_data[key]
                
        timeline_docs = db.collection("requests").document(req_id).collection("timeline").order_by("timestamp").stream()
        for t_doc in timeline_docs:
            t_data = t_doc.to_dict()
            timeline.append(TimelineItem(status=t_data["status"], timestamp=t_data["timestamp"]))
    else:
        for r_id, data in MOCK_DB["requests"].items():
            if data["tracking_id"] == tracking_id:
                request_data = data.copy()
                req_id = r_id
                break
                
        if not request_data:
            raise HTTPException(status_code=404, detail="Request not found")
            
        for key in ["location", "vulnerable_group", "created_at", "uid"]:
            if key in request_data:
                del request_data[key]
                
        if req_id in MOCK_DB["timelines"]:
            for t_data in MOCK_DB["timelines"][req_id]:
                timeline.append(TimelineItem(status=t_data["status"], timestamp=t_data["timestamp"]))
                
    return RequestDetailResponse(
        request_details=RequestResponse(**request_data),
        timeline=timeline
    )

@router.patch("/{id}/status")
def update_request_status(
    id: str,
    status: str = Body(...),
    note: Optional[str] = Body(None),
    current_user: dict = Depends(require_role(["officer", "admin"]))
):
    db = get_db()
    now = datetime.now(timezone.utc)
    
    if db:
        req_ref = db.collection("requests").document(id)
        doc = req_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Request not found")
            
        req_ref.update({"status": status})
        
        timeline_ref = req_ref.collection("timeline").document()
        timeline_data = {
            "status": status,
            "timestamp": now.isoformat()
        }
        if note:
            timeline_data["note"] = note
        timeline_ref.set(timeline_data)
    else:
        if id not in MOCK_DB["requests"]:
            raise HTTPException(status_code=404, detail="Request not found")
            
        MOCK_DB["requests"][id]["status"] = status
        timeline_data = {
            "status": status,
            "timestamp": now.isoformat()
        }
        if note:
            timeline_data["note"] = note
            
        if id not in MOCK_DB["timelines"]:
            MOCK_DB["timelines"][id] = []
        MOCK_DB["timelines"][id].append(timeline_data)
        
    return {"message": "Status updated successfully"}

