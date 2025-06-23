"""Define the state structures for the education and growth agent."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from src.resume_ranker.resume_analysis_agent.state import ResumeAnalysisState
from src.resume_ranker.resume_analysis_agent.state import PlanningResponse


# Education and Growth Pydantic Models
class EducationGrowthScores:
    """Structured scores for education and growth analysis."""
    educational_background: float = Field(ge=1, le=5, description="Relevance of educational background")
    certifications_relevance: float = Field(ge=1, le=5, description="Relevance of certifications")
    continuous_learning: float = Field(ge=1, le=5, description="Evidence of continuous learning")
    professional_development: float = Field(ge=1, le=5, description="Professional development activities")
    knowledge_application: float = Field(ge=1, le=5, description="Application of knowledge in practice"),
    justification: str = Field(description="Reasoning process for the scores")

class EducationGrowthPlanning(PlanningResponse):
    """Planning response for education and growth analysis."""
    formal_education: str = Field(description="Analysis of formal education")
    certifications_analysis: str = Field(description="Analysis of certifications and their relevance")
    learning_trajectory: str = Field(description="Observed learning and growth trajectory")


@dataclass(kw_only=True)
class EducationGrowthState(ResumeAnalysisState):
    """Represents the state for the education and growth agent.
    
    This class extends the ResumeAnalysisState with fields specific to education and growth assessment.
    """
    
    education_growth_scores: Dict[str, Any] = field(default_factory=dict)
    """Scores and analysis from education and growth analyst."""
    
    # Planning phase results
    planning_results: Dict[str, Any] = field(default_factory=dict)
    """Results from the planning phase analysis.""" 