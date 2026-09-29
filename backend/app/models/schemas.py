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
    spam_score: float = 0.0
    
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
    translated_text: Optional[str] = None

class TopCategory(BaseModel):
    category: str
    count: int

class TrendItem(BaseModel):
    date: str
    count: int

class AnalyticsSummaryResponse(BaseModel):
    total_requests: int
    resolved_rate: float
    top_categories: List[TopCategory]
    by_status: dict
    trend: List[TrendItem]

class HotspotResponse(BaseModel):
    cluster_id: str
    category: str
    count: int
    lat: float
    lng: float
    district: str
    block: str
    priority_score: float
    example_text: str

class GapAnalysisResponse(BaseModel):
    district: str
    block: str
    category: str
    demand_count: int
    population: int
    infra_index: float
    public_spending: float
    gap_score: float
