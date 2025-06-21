"""Define the state structures for the professional experience analyst agent."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

from src.resume_ranker.resume_analysis_agent.state import ResumeAnalysisState, PlanningResponse

# Professional Experience Pydantic Models
class ProfessionalExperienceScores:
    """Structured scores for professional experience analysis."""
    work_experience_relevance: float = Field(ge=1, le=5, description="Relevance of work experience to the job")
    career_progression: float = Field(ge=1, le=5, description="Quality of career progression")
    leadership_experience: float = Field(ge=1, le=5, description="Leadership experience and growth")
    achievements_impact: float = Field(ge=1, le=5, description="Impact and significance of achievements")
    industry_experience: float = Field(ge=1, le=5, description="Relevant industry experience")
    justification: str = Field(description="Reasoning process for the scores")


class ProfessionalExperiencePlanning(PlanningResponse):
    """Planning response for professional experience analysis."""
    experience_timeline: str = Field(description="Timeline analysis of professional experience")
    role_alignment: str = Field(description="How roles align with target position")
    skill_development_path: str = Field(description="Observed skill development progression")


@dataclass(kw_only=True)
class ProfessionalExperienceState(ResumeAnalysisState):
    """Represents the state for the professional experience analyst agent.
    
    This class extends the ResumeAnalysisState with fields specific to professional experience analysis.
    """
    
    professional_experience_scores: Dict[str, Any] = field(default_factory=dict)
    """Scores and analysis from professional experience analyst."""
    
    # Planning phase results
    planning_results: Dict[str, Any] = field(default_factory=dict)
    """Results from the planning phase analysis.""" 