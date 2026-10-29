"""Crack detection and structural integrity inspection router."""

import os
import time
from typing import Optional
from fastapi import APIRouter, File, Form, UploadFile

from database import save_result
from schemas import APIResponse, CrackResult
from services.llm import call_llm

router = APIRouter(prefix="/api/crack", tags=["Crack Assessment"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

CRACK_PROMPT_TEMPLATE = """You are a structural engineering expert. Analyze this image for cracks, fractures, structural distress, or surface degradation.
Location on structure: {location}
Inspector Notes: {notes}

Return ONLY valid JSON matching this exact schema:
{{
  "crack_detected": true, // true if cracks, fractures, or structural defects are visible
  "crack_type": "Hairline", // One of: "Hairline", "Structural", "Settlement", "Shrinkage", "None"
  "severity": "Low", // One of: "Low", "Medium", "High", "Critical"
  "possible_causes": [
    "Cause 1 (e.g. thermal expansion, foundation settlement, overload, poor curing)"
  ],
  "recommended_actions": [
    "Recommended repair action 1 (e.g. epoxy injection, structural retrofitting, ongoing monitoring)"
  ],
  "urgency": "Monitor", // One of: "Monitor", "Repair Soon", "Immediate Action"
  "summary": "Detailed structural engineering summary explaining findings, risks, and next steps."
}}"""


@router.post("", response_model=APIResponse)
async def analyze_crack(
    image: UploadFile = File(...),
    location: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
):
    """Analyze uploaded structural element photo for cracks and integrity issues."""
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
        loc_str = location.strip() if location else "Not specified"
        notes_str = notes.strip() if notes else "None"
        prompt = CRACK_PROMPT_TEMPLATE.format(location=loc_str, notes=notes_str)

        # Call multimodal LLM
        mime_type = image.content_type or "image/jpeg"
        llm_response = call_llm(prompt=prompt, image_bytes=image_bytes, image_mime=mime_type)

        if isinstance(llm_response, dict) and llm_response.get("success") is False:
            return APIResponse(success=False, error=llm_response.get("error", "AI crack analysis failed"))

        # Unwrap if nested under data
        data_to_validate = (
            llm_response.get("data")
            if (isinstance(llm_response, dict) and "data" in llm_response and "crack_detected" not in llm_response)
            else llm_response
        )

        # Validate with Pydantic schema
        result = CrackResult(**data_to_validate)

        # Save to database
        input_summary = f"Crack Inspection: {loc_str} (File: {image.filename})"
        save_result(
            result_type="crack",
            input_summary=input_summary,
            result_json=result.model_dump(),
        )

        return APIResponse(success=True, data=result.model_dump())

    except Exception as exc:
        return APIResponse(success=False, error=f"Crack assessment error: {str(exc)}")
