"""Pydantic schemas for the Construction Intelligence Platform.

Defines all input request models and output response models.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ============================================================================
# Generic API Wrapper
# ============================================================================
class APIResponse(BaseModel):
    """Standardized response wrapper across all API endpoints."""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None


# ============================================================================
# Safety Analysis Models
# ============================================================================
class PPECompliance(BaseModel):
    """Checklist of detected PPE equipment."""
    helmet: bool = False
    vest: bool = False
    gloves: bool = False
    boots: bool = False


class Violation(BaseModel):
    """Specific safety violation or hazard detected."""
    issue: str
    severity: str = "Medium"  # Low | Medium | High
    recommendation: str


class SafetyResult(BaseModel):
    """Full safety audit result."""
    overall_risk: str = "Medium"  # Low | Medium | High | Critical
    ppe_compliance: PPECompliance = Field(default_factory=PPECompliance)
    violations: List[Violation] = Field(default_factory=list)
    summary: str = ""


# ============================================================================
# Crack & Structural Analysis Models
# ============================================================================
class CrackResult(BaseModel):
    """Crack detection and structural integrity assessment."""
    crack_detected: bool = False
    crack_type: str = "None"  # Hairline | Structural | Settlement | Shrinkage | None
    severity: str = "Low"  # Low | Medium | High | Critical
    possible_causes: List[str] = Field(default_factory=list)
    recommended_actions: List[str] = Field(default_factory=list)
    urgency: str = "Monitor"  # Monitor | Repair Soon | Immediate Action
    summary: str = ""


# ============================================================================
# Valuation Models
# ============================================================================
class PriceRange(BaseModel):
    """Estimated price range for property valuation."""
    min: float = 0.0
    max: float = 0.0


class ValuationFactor(BaseModel):
    """Positive, negative, or neutral factors affecting valuation."""
    factor: str
    impact: str = "Neutral"  # Positive | Negative | Neutral


class ValuationResult(BaseModel):
    """AI-powered real estate estimation result."""
    estimated_value: float = 0.0
    price_range: PriceRange = Field(default_factory=PriceRange)
    currency: str = "INR"
    price_per_sqft: float = 0.0
    factors: List[ValuationFactor] = Field(default_factory=list)
    summary: str = ""
    disclaimer: str = "AI estimate, not a certified valuation."


# ============================================================================
# Project Planning Models
# ============================================================================
class Phase(BaseModel):
    """Individual construction milestone phase."""
    name: str
    duration_weeks: int = 0
    tasks: List[str] = Field(default_factory=list)
    estimated_cost: float = 0.0


class Material(BaseModel):
    """Bill of quantities material estimation."""
    item: str
    quantity: str
    estimated_cost: float = 0.0


class ManpowerItem(BaseModel):
    """Staffing and labor requirement."""
    role: str
    count: int = 0


class PlanningResult(BaseModel):
    """Comprehensive construction plan."""
    phases: List[Phase] = Field(default_factory=list)
    materials: List[Material] = Field(default_factory=list)
    manpower: List[ManpowerItem] = Field(default_factory=list)
    risks: List[str] = Field(default_factory=list)
    total_estimated_cost: float = 0.0
    total_duration_weeks: int = 0


# ============================================================================
# Weather & Daily Assistant Models
# ============================================================================
class WeatherData(BaseModel):
    """Local meteorological forecast."""
    temperature: float = 0.0
    rain_probability: float = 0.0
    wind_speed: float = 0.0
    condition: str = "Unknown"


class WorkAdvisory(BaseModel):
    """Activity-specific recommendation based on site conditions."""
    activity: str
    recommendation: str = "Proceed"  # Proceed | Proceed with Caution | Postpone
    reason: str


class DailyAssistantResult(BaseModel):
    """Daily site briefing result."""
    weather: WeatherData = Field(default_factory=WeatherData)
    work_advisory: List[WorkAdvisory] = Field(default_factory=list)
    safety_tips: List[str] = Field(default_factory=list)
    daily_checklist: List[str] = Field(default_factory=list)
    summary: str = ""


# ============================================================================
# Knowledge Q&A Models
# ============================================================================
class KnowledgeResult(BaseModel):
    """Construction technical knowledge answer."""
    answer: str = ""
    related_topics: List[str] = Field(default_factory=list)


# ============================================================================
# API Request Models for JSON Endpoints
# ============================================================================
class PlanningRequest(BaseModel):
    """Input payload for construction project planning."""
    project_type: str
    area_sqft: float
    budget: float
    duration_months: Optional[int] = 12
    location: Optional[str] = ""


class DailyAssistantRequest(BaseModel):
    """Input payload for daily site assistant advisory."""
    city: str
    work_description: str


class KnowledgeRequest(BaseModel):
    """Input payload for construction engineering Q&A."""
    question: str
    history: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
