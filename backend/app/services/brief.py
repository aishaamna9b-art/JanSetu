from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
import tempfile
import os
from google import genai
from app.config import settings

def get_gemini_client():
    if not settings.GEMINI_API_KEY:
        return None
    return genai.Client(api_key=settings.GEMINI_API_KEY)

def generate_brief_content(state: str, district: str) -> str:
    client = get_gemini_client()
    if not client or settings.DEV_MODE:
        return f"Executive Summary: Top priority remains water infrastructure in {district}, with numerous severe complaints. Recommend allocating funds for pipeline overhaul."
        
    prompt = f"Write a very short executive policy brief (1-2 paragraphs) for the district of {district} in {state} regarding recent public infrastructure requests. Highlight water and road issues."
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        if response and response.text:
            return response.text.strip()
    except Exception:
        pass
    
    return f"Executive Summary: High demand for infrastructure improvements in {district}, {state}. Review hotspots for detailed allocation recommendations."

def create_pdf_brief(state: str, district: str, summary_text: str) -> str:
    # returns path to a temp pdf file
    fd, path = tempfile.mkstemp(suffix=".pdf")
    os.close(fd)
    
    doc = SimpleDocTemplate(path, pagesize=letter)
    styles = getSampleStyleSheet()
    Story = []
    
    title = f"Policy Brief: {district}, {state}"
    Story.append(Paragraph(title, styles['Title']))
    Story.append(Spacer(1, 12))
    
    Story.append(Paragraph("Executive Summary", styles['Heading2']))
    Story.append(Spacer(1, 12))
    
    # Simple split by newlines for paragraphs
    for para in summary_text.split('\n'):
        if para.strip():
            Story.append(Paragraph(para.strip(), styles['Normal']))
            Story.append(Spacer(1, 12))
            
    doc.build(Story)
    return path
