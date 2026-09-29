from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class AuthSessionResponse(BaseModel):
    uid: str
    role: str
    language: str
    region: str

class RequestCreate(BaseModel):
    text: Optional[str] = None
    language: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    state: Optional[str] = None
    district: Optional[str] = None
    block: Optional[str] = None

class PhotoAnalysisSchema(BaseModel):
    matches_request: bool
    detected_issue: str
    severity: int
    confidence: float
    
class TimelineItem(BaseModel):
    status: str
    timestamp: datetime

class RequestResponse(BaseModel):
    id: str
    tracking_id: str
    category: str
    sub_issue: str
    urgency: int
    sentiment: str
    translated_text: str
    original_text: str
    confirmation_message: str
    confirmation_audio_url: Optional[str] = None
    photo_analysis: Optional[PhotoAnalysisSchema] = None
    cluster_id: Optional[str] = None
    status: str

class RequestDetailResponse(BaseModel):
    request_details: RequestResponse
    timeline: List[TimelineItem]

class GeminiExtractionResult(BaseModel):
    category: str
    sub_issue: str
    urgency: int = Field(ge=1, le=5)
    sentiment: str
    vulnerable_group: bool
    location_hint: Optional[str] = None
