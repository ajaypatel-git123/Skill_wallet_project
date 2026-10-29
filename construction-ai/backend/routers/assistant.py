"""Daily site briefing and weather-aware construction advisory router."""

import json
from fastapi import APIRouter

from database import save_result
from schemas import APIResponse, DailyAssistantRequest, DailyAssistantResult, WeatherData
from services.llm import call_llm
from services.weather import get_weather

router = APIRouter(prefix="/api/assistant", tags=["Daily Site Assistant"])

ASSISTANT_PROMPT_TEMPLATE = """You are an expert construction site supervisor and safety advisor.
Review today's local weather conditions and planned site activities to generate safety advisories, activity recommendations, and an actionable daily checklist.

Current Site Weather:
- City / Location: {city}
- Temperature: {temperature} °C
- Rain Probability: {rain_probability} %
- Wind Speed: {wind_speed} km/h
- Sky Condition: {condition}

Planned Work for Today:
{work_description}

Return ONLY valid JSON matching this exact schema:
{{
  "work_advisory": [
    {{
      "activity": "Activity name (e.g. Roof Concreting, Exterior Scaffolding)",
      "recommendation": "Proceed", // One of: "Proceed", "Proceed with Caution", "Postpone"
      "reason": "Specific technical or safety reason based on temperature, rain, or wind"
    }}
  ],
  "safety_tips": [
    "Practical safety advice tailored to current weather and activities (e.g. ensure tethering harness in high winds)"
  ],
  "daily_checklist": [
    "Pre-shift inspection item (e.g. check electrical cables for water ingress, verify crane anchor)"
  ],
  "summary": "Concise summary briefing for the morning toolbox meeting."
}}"""


@router.post("/daily", response_model=APIResponse)
async def daily_briefing(request: DailyAssistantRequest):
    """Provide daily weather-aware construction guidance and task checklists."""
    try:
        # 1. Fetch live weather conditions for site city
        weather_dict = get_weather(request.city)

        # 2. Prepare LLM prompt with weather conditions and planned work
        prompt = ASSISTANT_PROMPT_TEMPLATE.format(
            city=request.city,
            temperature=weather_dict.get("temperature", 25.0),
            rain_probability=weather_dict.get("rain_probability", 0.0),
            wind_speed=weather_dict.get("wind_speed", 0.0),
            condition=weather_dict.get("condition", "Clear"),
            work_description=request.work_description,
        )

        llm_response = call_llm(prompt=prompt)

        if isinstance(llm_response, dict) and llm_response.get("success") is False:
            return APIResponse(success=False, error=llm_response.get("error", "Daily briefing generation failed"))

        data_to_validate = (
            llm_response.get("data")
            if (isinstance(llm_response, dict) and "data" in llm_response and "work_advisory" not in llm_response)
            else llm_response
        )

        # 3. Merge verified live weather data into result
        data_to_validate["weather"] = weather_dict

        result = DailyAssistantResult(**data_to_validate)

        # 4. Save result in SQLite database
        input_summary = f"Daily Briefing: {request.city} - {request.work_description[:60]}"
        save_result(
            result_type="daily",
            input_summary=input_summary,
            result_json=result.model_dump(),
        )

        return APIResponse(success=True, data=result.model_dump())

    except Exception as exc:
        return APIResponse(success=False, error=f"Daily assistant error: {str(exc)}")
