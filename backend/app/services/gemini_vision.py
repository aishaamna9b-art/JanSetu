import json
from google import genai
from google.genai import types
from pydantic import ValidationError
from app.models.schemas import PhotoAnalysisSchema
from app.config import settings

def get_gemini_client():
    return genai.Client(api_key=settings.GEMINI_API_KEY)

def analyze_photo(photo_bytes: bytes, mime_type: str, claimed_category: str) -> PhotoAnalysisSchema:
    if not settings.GEMINI_API_KEY:
        return PhotoAnalysisSchema(
            matches_request=True,
            detected_issue="Mock issue from dev mode",
            severity=3,
            confidence=0.9,
            spam_score=0.1
        )

    client = get_gemini_client()
    
    prompt = f"""
    Analyze the following image provided by a citizen reporting an issue.
    The citizen claims the issue category is: "{claimed_category}".
    
    Extract the following details in strict JSON format.
    The response MUST be valid JSON only, without markdown blocks.
    
    JSON Schema:
    {{
        "matches_request": "boolean (true if the image seems related to the claimed category, false otherwise)",
        "detected_issue": "string (brief description of what you see in the photo)",
        "severity": "integer (1 to 5, where 5 is critical/severe damage or hazard)",
        "confidence": "float (0.0 to 1.0, your confidence in the assessment)",
        "spam_score": "float (0.0 to 1.0, where 1.0 means it is highly likely to be a spam/unrelated/fake photo)"
    }}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-3.5-flash-lite',
            contents=[
                types.Part.from_bytes(data=photo_bytes, mime_type=mime_type),
                prompt
            ]
        )
        
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
            
        data = json.loads(raw_text.strip())
        
        result = PhotoAnalysisSchema(**data)
        return result
        
    except (json.JSONDecodeError, ValidationError, Exception) as e:
        return PhotoAnalysisSchema(
            matches_request=True, # default to true so it doesn't penalize
            detected_issue="Failed to analyze photo",
            severity=3,
            confidence=0.0,
            spam_score=0.0
        )
