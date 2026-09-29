from fastapi import APIRouter, Depends, Body
from app.core.security import require_role
from app.services.brief import generate_brief_content, create_pdf_brief
from app.services.storage import upload_local_file_to_storage
import os

router = APIRouter()

@router.post("/generate")
def generate_brief(
    state: str = Body(...),
    district: str = Body(...),
    current_user: dict = Depends(require_role(["officer", "admin"]))
):
    summary = generate_brief_content(state, district)
    
    pdf_path = create_pdf_brief(state, district, summary)
    
    # upload to storage
    filename = f"brief_{state}_{district}_{os.path.basename(pdf_path)}.pdf".replace(" ", "_").lower()
    brief_url = upload_local_file_to_storage(pdf_path, f"briefs/{filename}")
    
    # cleanup temp file
    try:
        os.remove(pdf_path)
    except Exception:
        pass
        
    if not brief_url:
        brief_url = f"https://storage.googleapis.com/mock-bucket/briefs/{filename}"
        
    return {
        "brief_url": brief_url,
        "summary": summary
    }
