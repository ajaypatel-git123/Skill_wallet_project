"""Construction engineering and standards knowledge Q&A router."""

import json
from fastapi import APIRouter

from database import save_result
from schemas import APIResponse, KnowledgeRequest, KnowledgeResult
from services.llm import call_llm

router = APIRouter(prefix="/api/knowledge", tags=["Construction Knowledge"])

KNOWLEDGE_PROMPT_TEMPLATE = """You are a senior civil and structural engineering knowledge specialist with deep expertise in construction techniques, materials, building codes (such as Indian Standards IS codes, Eurocodes, ACI), and project best practices.

Conversation Context:
{history}

User Question:
{question}

Return ONLY valid JSON matching this exact schema:
{{
  "answer": "Clear, technically thorough, and practical engineering answer addressing the question.",
  "related_topics": [
    "Relevant topic or follow-up concept 1",
    "Relevant topic or follow-up concept 2",
    "Relevant topic or follow-up concept 3"
  ]
}}"""


@router.post("", response_model=APIResponse)
async def ask_knowledge(request: KnowledgeRequest):
    """Answer technical construction and civil engineering questions with contextual history."""
    try:
        # Format conversation history
        history_lines = []
        if request.history:
            for item in request.history:
                role = item.get("role", "User").capitalize()
                content = item.get("content", "").strip()
                history_lines.append(f"{role}: {content}")
        history_str = "\n".join(history_lines) if history_lines else "None"

        prompt = KNOWLEDGE_PROMPT_TEMPLATE.format(
            history=history_str,
            question=request.question,
        )

        llm_response = call_llm(prompt=prompt)

        if isinstance(llm_response, dict) and llm_response.get("success") is False:
            return APIResponse(success=False, error=llm_response.get("error", "Knowledge query failed"))

        data_to_validate = (
            llm_response.get("data")
            if (isinstance(llm_response, dict) and "data" in llm_response and "answer" not in llm_response)
            else llm_response
        )

        result = KnowledgeResult(**data_to_validate)

        # Save to database
        input_summary = f"Q&A: {request.question[:80]}"
        save_result(
            result_type="knowledge",
            input_summary=input_summary,
            result_json=result.model_dump(),
        )

        return APIResponse(success=True, data=result.model_dump())

    except Exception as exc:
        return APIResponse(success=False, error=f"Knowledge query error: {str(exc)}")
