from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class AuthSessionResponse(BaseModel):
    uid: str
    role: str
    language: str
    region: str
    is_new_user: bool
    profile_complete: bool

class IDProofSchema(BaseModel):
    type: str
    last4: str

class PersonalDetailsSchema(BaseModel):
    full_name: Optional[str] = None
    relation_type: Optional[str] = None
    relation_name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None

class ContactDetailsSchema(BaseModel):
    mobile: Optional[str] = None
    email: Optional[str] = None
    alt_mobile: Optional[str] = None

class AddressDetailsSchema(BaseModel):
    house_no: Optional[str] = None
    street: Optional[str] = None
    village_or_ward: Optional[str] = None
    post_office: Optional[str] = None
    pincode: Optional[str] = None
    block: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None

class PreferencesSchema(BaseModel):
    language: Optional[str] = None
    notify_sms: bool = False
    notify_whatsapp: bool = False

class UserProfileSchema(BaseModel):
    uid: str
    role: str = "citizen"
    profile_complete: bool = False
    personal: PersonalDetailsSchema = Field(default_factory=PersonalDetailsSchema)
    contact: ContactDetailsSchema = Field(default_factory=ContactDetailsSchema)
    address: AddressDetailsSchema = Field(default_factory=AddressDetailsSchema)
    occupation: Optional[str] = None
    is_differently_abled: Optional[bool] = None
    id_proof: Optional[IDProofSchema] = None
    preferences: PreferencesSchema = Field(default_factory=PreferencesSchema)
    consent_given: bool = False
    declaration_accepted: bool = False
    registration_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


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
    confirmation_message: Optional[str] = None
    confirmation_audio_url: Optional[str] = None
    photo_url: Optional[str] = None
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

class ScoreBreakdown(BaseModel):
    volume: float
    urgency: float
    severity: float
    infra_gap: float
    population: float

class ProjectRecommendation(BaseModel):
    project_id: str
    cluster_id: str
    title: str
    category: str
    region: str
    people_served: int
    cost_estimate: float
    priority_score: float
    score_breakdown: ScoreBreakdown
    ai_justification: str

class SimulatorRunRequest(BaseModel):
    budget: float
    state: str
    district: str
    categories: List[str]

class SimulatorRunResponse(BaseModel):
    selected: List[ProjectRecommendation]
    total_cost: float
    remaining_budget: float
    people_served: int
    gaps_closed: int
    ai_justification: str

