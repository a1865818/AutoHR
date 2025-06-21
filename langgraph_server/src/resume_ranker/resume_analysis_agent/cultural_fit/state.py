"""Define the state structures for the cultural fit agent."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Any, List
from pydantic import Field

from src.resume_ranker.resume_analysis_agent.state import ResumeAnalysisState
from src.resume_ranker.resume_analysis_agent.state import PlanningResponse


# Cultural Fit Pydantic Models
class CulturalFitScores:
    """Structured scores for cultural fit analysis."""
    values_alignment: float = Field(ge=1, le=5, description="Alignment with company values")
    communication_style: float = Field(ge=1, le=5, description="Communication style fit")
    work_environment_fit: float = Field(ge=1, le=5, description="Fit with work environment")
    team_collaboration: float = Field(ge=1, le=5, description="Team collaboration potential")
    justification: str = Field(description="Reasoning process for the scores")


class CulturalFitPlanning(PlanningResponse):
    """Planning response for cultural fit analysis."""
    value_indicators: List[str] = Field(description="Indicators of personal values from resume")
    communication_evidence: str = Field(description="Evidence of communication style")
    collaboration_indicators: List[str] = Field(description="Indicators of collaboration ability")


@dataclass(kw_only=True)
class CulturalFitState(ResumeAnalysisState):
    """Represents the state for the cultural fit agent.
    
    This class extends the ResumeAnalysisState with fields specific to cultural fit assessment.
    """
    
    communication_style: Dict[str, Any] = field(default_factory=dict)
    """Assessment of the candidate's communication style from resume language."""
    
    value_alignment: Dict[str, Any] = field(default_factory=dict)
    """Assessment of alignment with company values."""
    
    collaboration_evidence: List[str] = field(default_factory=list)
    """Evidence of collaboration and teamwork from the resume."""
    
    innovation_markers: List[str] = field(default_factory=list)
    """Markers of innovation and initiative from the resume."""
    
    # Planning phase results
    planning_results: Dict[str, Any] = field(default_factory=dict)
    """Results from the planning phase analysis.""" 