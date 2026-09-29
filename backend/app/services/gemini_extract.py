import json
from google import genai
from pydantic import ValidationError
from app.models.schemas import GeminiExtractionResult
from app.models.enums import Category

from app.config import settings

def get_gemini_client():
    return genai.Client(api_key=settings.GEMINI_API_KEY)

def extract_request_details(text: str) -> GeminiExtractionResult:
    if not text:
        return GeminiExtractionResult(
            category=Category.OTHER,
            sub_issue="unknown",
            urgency=1,
            sentiment="neutral",
            vulnerable_group=False,
            location_hint=None,
            translated_text=None
        )
        
    client = get_gemini_client()
    
    prompt = f"""
    Analyze the following citizen request text and extract the details in strict JSON format.
    The response MUST be valid JSON only, without markdown blocks.
    
    Categories available: {[c.value for c in Category]}
    
    JSON Schema:
    {{
        "category": "string (must be one of the available categories, or 'other')",
        "sub_issue": "string (short description of the specific issue)",
        "urgency": "integer (1 to 5, where 5 is critical/life-threatening)",
        "sentiment": "string (e.g. frustrated, neutral, urgent, angry)",
        "vulnerable_group": "boolean (true if it mentions elderly, children, disabled, or poor)",
        "location_hint": "string (any extracted location names or landmarks, or null)",
        "translated_text": "string (the english translation of the request text. if already in english, return it as is)"
    }}
    
    Request Text:
    "{text}"
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-3.8-flash',
            contents=prompt,
        )
        
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
            
        data = json.loads(raw_text.strip())
        
        result = GeminiExtractionResult(**data)
        
        try:
            Category(result.category)
        except ValueError:
            result.category = Category.OTHER
            
        return result
        
    except (json.JSONDecodeError, ValidationError, Exception) as e:
        return GeminiExtractionResult(
            category=Category.OTHER,
            sub_issue="extraction_failed",
            urgency=3,
            sentiment="unknown",
            vulnerable_group=False,
            location_hint=None,
            translated_text=None
        )
