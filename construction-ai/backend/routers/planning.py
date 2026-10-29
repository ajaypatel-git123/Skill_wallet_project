"""Construction project planning and resource estimation router."""

from fastapi import APIRouter

from database import save_result
from schemas import APIResponse, PlanningRequest, PlanningResult
from services.llm import call_llm

router = APIRouter(prefix="/api/planning", tags=["Project Planning"])

PLANNING_PROMPT_TEMPLATE = """You are an experienced construction project manager and cost engineer.
Create a detailed, realistic project plan, milestone schedule, bill of materials, staffing, and risk register for the following construction project:

- Project Type: {project_type}
- Built-up Area: {area_sqft} sq ft
- Target Budget: {budget} INR
- Target Duration: {duration_months} months
- Site Location: {location}

Return ONLY valid JSON matching this exact schema:
{{
  "phases": [
    {{
      "name": "Phase name (e.g. Substructure & Foundation)",
      "duration_weeks": 4,
      "tasks": [
        "Specific milestone task 1",
        "Specific milestone task 2"
      ],
      "estimated_cost": 350000.0
    }}
  ],
  "materials": [
    {{
      "item": "Material name (e.g. TMT Steel Bars Fe500D)",
      "quantity": "12 Metric Tons",
      "estimated_cost": 720000.0
    }}
  ],
  "manpower": [
    {{
      "role": "Role title (e.g. Mason, Barbender, Site Engineer)",
      "count": 6
    }}
  ],
  "risks": [
    "Detailed risk factor (e.g. Monsoon waterlogging during foundation, concrete curing schedule delay)"
  ],
  "total_estimated_cost": 2500000.0,
  "total_duration_weeks": 24
}}"""


@router.post("", response_model=APIResponse)
async def generate_project_plan(request: PlanningRequest):
    """Generate comprehensive construction phases, materials, manpower, and risks."""
    try:
        prompt = PLANNING_PROMPT_TEMPLATE.format(
            project_type=request.project_type,
            area_sqft=request.area_sqft,
            budget=request.budget,
            duration_months=request.duration_months,
            location=request.location,
        )

        llm_response = call_llm(prompt=prompt)

        if isinstance(llm_response, dict) and llm_response.get("success") is False:
            return APIResponse(success=False, error=llm_response.get("error", "Project planning generation failed"))

        data_to_validate = (
            llm_response.get("data")
            if (isinstance(llm_response, dict) and "data" in llm_response and "phases" not in llm_response)
            else llm_response
        )

        result = PlanningResult(**data_to_validate)

        input_summary = f"Plan: {request.project_type} in {request.location} ({request.area_sqft} sqft, Budget: {request.budget})"
        save_result(
            result_type="planning",
            input_summary=input_summary,
            result_json=result.model_dump(),
        )

        return APIResponse(success=True, data=result.model_dump())

    except Exception as exc:
        return APIResponse(success=False, error=f"Planning error: {str(exc)}")
