"""Real estate and construction property valuation router."""

import os
import time
from typing import Optional
from fastapi import APIRouter, File, Form, UploadFile

from database import save_result
from schemas import APIResponse, ValuationResult
from services.llm import call_llm

router = APIRouter(prefix="/api/valuation", tags=["Property Valuation"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

VALUATION_PROMPT_TEMPLATE = """You are a premier real estate and property valuation expert specializing in the Indian real estate market.
Estimate the fair market property value and rate per square foot based on the following property details and optional site photos:

- Location: {location}
- Property Type: {property_type}
- Built-up Area: {area_sqft} sq ft
- Age of Property: {age_years} years
- Number of Bedrooms / Units: {bedrooms}
- Overall Physical Condition: {condition}
- Amenities & Features: {amenities}

Return ONLY valid JSON matching this exact schema:
{{
  "estimated_value": 0.0, // Total estimated valuation in INR (e.g. 7500000)
  "price_range": {{
    "min": 0.0,          // Conservative lower bound in INR
    "max": 0.0           // Upper bound in INR
  }},
  "currency": "INR",
  "price_per_sqft": 0.0, // Estimated price per sq ft in INR
  "factors": [
    {{
      "factor": "Description of factor affecting price (e.g. prime connectivity, property age, premium finish)",
      "impact": "Positive" // One of: "Positive", "Negative", "Neutral"
    }}
  ],
  "summary": "Detailed narrative explaining market trends in the locality, methodology, and rationale for the valuation.",
  "disclaimer": "AI estimate, not a certified valuation. Actual market prices vary depending on negotiations, legal checks, and physical inspections."
}}"""


@router.post("", response_model=APIResponse)
async def estimate_valuation(
    location: str = Form(...),
    property_type: str = Form(...),
    area_sqft: float = Form(...),
    age_years: int = Form(...),
    bedrooms: int = Form(...),
    condition: str = Form(...),
    amenities: str = Form(""),
    image: Optional[UploadFile] = File(None),
):
    """Estimate real estate valuation based on property parameters and optional site photos."""
    try:
        image_bytes = None
        image_mime = None

        if image and image.filename:
            image_bytes = await image.read()
            if image_bytes:
                image_mime = image.content_type or "image/jpeg"
                filename = f"{int(time.time())}_{image.filename}"
                file_path = os.path.join(UPLOAD_DIR, filename)
                with open(file_path, "wb") as f:
                    f.write(image_bytes)

        prompt = VALUATION_PROMPT_TEMPLATE.format(
            location=location,
            property_type=property_type,
            area_sqft=area_sqft,
            age_years=age_years,
            bedrooms=bedrooms,
            condition=condition,
            amenities=amenities if amenities else "Standard",
        )

        llm_response = call_llm(prompt=prompt, image_bytes=image_bytes, image_mime=image_mime)

        if isinstance(llm_response, dict) and llm_response.get("success") is False:
            return APIResponse(success=False, error=llm_response.get("error", "AI valuation failed"))

        data_to_validate = (
            llm_response.get("data")
            if (isinstance(llm_response, dict) and "data" in llm_response and "estimated_value" not in llm_response)
            else llm_response
        )

        result = ValuationResult(**data_to_validate)
        # Ensure disclaimer is always present
        if not result.disclaimer:
            result.disclaimer = "AI estimate, not a certified valuation."

        input_summary = f"Valuation: {property_type} in {location} ({area_sqft} sqft)"
        save_result(
            result_type="valuation",
            input_summary=input_summary,
            result_json=result.model_dump(),
        )

        return APIResponse(success=True, data=result.model_dump())

    except Exception as exc:
        return APIResponse(success=False, error=f"Valuation error: {str(exc)}")
