"""LLM service utilizing Groq API for multimodal construction intelligence."""

import base64
import json
import logging
import os
import re
from typing import Any, Dict, Optional

from dotenv import load_dotenv
from groq import Groq

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Active multimodal model on Groq supporting both vision and text
MODEL_NAME = "qwen/qwen3.8-27b"


def _get_client() -> Groq:
    """Get or create the Groq client with latest configured API key."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or api_key == "your_groq_api_key_here":
        raise ValueError("GROQ_API_KEY is not configured. Please set GROQ_API_KEY in backend/.env")
    return Groq(api_key=api_key)


def strip_json_fences(text: str) -> str:
    """Clean markdown code fences and extraneous text around JSON content."""
    cleaned = text.strip()
    # Match markdown code block ```json ... ``` or ``` ... ```
    fence_pattern = re.compile(r"```(?:json)?\s*([\s\S]*?)\s*```", re.IGNORECASE)
    match = fence_pattern.search(cleaned)
    if match:
        cleaned = match.group(1).strip()
    else:
        # Fallback: locate outermost JSON braces or brackets
        start_obj = cleaned.find("{")
        end_obj = cleaned.rfind("}")
        if start_obj != -1 and end_obj != -1 and end_obj > start_obj:
            cleaned = cleaned[start_obj : end_obj + 1].strip()

    return cleaned


def _build_messages(prompt: str, image_bytes: Optional[bytes] = None, image_mime: Optional[str] = None):
    """Construct chat messages for Groq API with optional inline image."""
    if image_bytes:
        mime = image_mime or "image/jpeg"
        b64_data = base64.b64encode(image_bytes).decode("utf-8")
        content = [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64_data}"}},
        ]
    else:
        content = prompt

    return [{"role": "user", "content": content}]


def call_llm(
    prompt: str,
    image_bytes: Optional[bytes] = None,
    image_mime: Optional[str] = None,
) -> Dict[str, Any]:
    """Call Groq API to analyze text and optional image input.

    Args:
        prompt: Detailed prompt instructions embedding required JSON schema
        image_bytes: Raw image bytes for multimodal analysis
        image_mime: MIME type of the provided image (e.g., 'image/jpeg', 'image/png')

    Returns:
        Dict containing either the parsed JSON data, or {'success': False, 'error': ...}
    """
    try:
        client = _get_client()
    except ValueError as e:
        return {"success": False, "error": str(e)}

    # Ensure prompt mentions json so response_format json_object is accepted
    enforced_prompt = prompt
    if "json" not in prompt.lower():
        enforced_prompt = f"{prompt}\nReturn your response as a valid JSON object."

    messages = _build_messages(enforced_prompt, image_bytes, image_mime)

    # First attempt: use json_object mode for strict parsing
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=4096,
        )
        raw_text = response.choices[0].message.content or ""
        cleaned_text = strip_json_fences(raw_text)
        return json.loads(cleaned_text)
    except Exception as first_err:
        logger.warning(f"First attempt with json_object mode encountered: {first_err}. Attempting fallback...")

    # Second attempt: standard completion with strict recovery instruction
    try:
        retry_prompt = (
            f"{enforced_prompt}\n\n"
            "CRITICAL: Output ONLY a single raw valid JSON object conforming to the required schema. "
            "Do NOT include markdown formatting, backticks, or preamble."
        )
        retry_messages = _build_messages(retry_prompt, image_bytes, image_mime)
        retry_response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=retry_messages,
            temperature=0.2,
            max_tokens=4096,
        )
        retry_raw = retry_response.choices[0].message.content or ""
        retry_cleaned = strip_json_fences(retry_raw)
        return json.loads(retry_cleaned)
    except Exception as final_err:
        logger.error(f"Final parse attempt failed: {final_err}")
        return {
            "success": False,
            "error": f"Failed to parse AI response: {str(final_err)}",
        }
