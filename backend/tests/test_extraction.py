import pytest
from app.services.gemini_extract import extract_request_details
from app.models.schemas import GeminiExtractionResult
from app.models.enums import Category

def test_extract_request_details_empty():
    result = extract_request_details("")
    assert result.category == Category.OTHER
    assert result.sub_issue == "unknown"
    assert result.urgency == 1
    assert result.sentiment == "neutral"

def test_extract_request_details_dev_mode(monkeypatch):
    from app.config import settings
    monkeypatch.setattr(settings, "DEV_MODE", True)
    
    result = extract_request_details("Help me, pipe broke")
    assert result.category == Category.WATER
    assert result.sub_issue == "mock issue"
    assert result.urgency == 3
    assert result.translated_text == "Help me, pipe broke"
