"""Safety inspection router for PPE compliance and site hazard detection."""

import os
import time
from typing import Optional
from fastapi import APIRouter, File, Form, UploadFile

from database import save_result
from schemas import APIResponse, SafetyResult
from services.llm import call_llm

router = APIRouter(prefix="/api/safety", tags=["Safety"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

SAFETY_PROMPT_TEMPLATE = """You are a construction safety expert. Analyze this construction site image for safety hazards, worker PPE compliance, and general site risks.
Notes provided by inspector: {notes}

Return ONLY valid JSON matching this exact schema:
{{
  "overall_risk": "Low",  // One of: "Low", "Medium", "High", "Critical"
  "ppe_compliance": {{
    "helmet": false,     // true if workers are wearing hard hats / helmets
    "vest": false,       // true if workers are wearing high-visibility vests
    "gloves": false,     // true if workers are wearing protective gloves
    "boots": false       // true if workers are wearing safety boots
  }},
  "violations": [
    {{
      "issue": "Description of safety violation or hazard observed",
      "severity": "Medium",  // One of: "Low", "Medium", "High"
      "recommendation": "Actionable safety correction"
    }}
  ],
  "summary": "Comprehensive overview of the safety condition observed in the image."
}}"""


@router.post("", response_model=APIResponse)
async def analyze_safety(
    image: UploadFile = File(...),
    notes: Optional[str] = Form(None),
):
    """Analyze uploaded construction site photo for PPE compliance and safety hazards."""
    try:
        # Read uploaded image bytes
        image_bytes = await image.read()
        if not image_bytes:
            return APIResponse(success=False, error="Empty image file uploaded.")

        # Save image copy to uploads folder
        filename = f"{int(time.time())}_{image.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(image_bytes)

        # Prepare prompt
        notes_str = notes.strip() if notes else "None"
        prompt = SAFETY_PROMPT_TEMPLATE.format(notes=notes_str)

        # Call multimodal LLM
        mime_type = image.content_type or "image/jpeg"
        llm_response = call_llm(prompt=prompt, image_bytes=image_bytes, image_mime=mime_type)

        if isinstance(llm_response, dict) and llm_response.get("success") is False:
            return APIResponse(success=False, error=llm_response.get("error", "AI safety analysis failed"))

        # Unwrap if nested under data
        data_to_validate = (
            llm_response.get("data")
            if (isinstance(llm_response, dict) and "data" in llm_response and "overall_risk" not in llm_response)
            else llm_response
        )

        # Validate with Pydantic schema
        result = SafetyResult(**data_to_validate)

        # Save to database
        input_summary = f"Safety Audit: {image.filename} (Notes: {notes_str})"
        save_result(
            result_type="safety",
            input_summary=input_summary,
            result_json=result.model_dump(),
        )

        return APIResponse(success=True, data=result.model_dump())

    except Exception as exc:
        return APIResponse(success=False, error=f"Safety analysis error: {str(exc)}")
