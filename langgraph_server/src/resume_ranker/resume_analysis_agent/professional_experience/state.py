"""Define the state structures for the professional experience analyst agent."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Any

from src.resume_ranker.resume_analysis_agent.state import ResumeAnalysisState


@dataclass(kw_only=True)
class ProfessionalExperienceState(ResumeAnalysisState):
    """Represents the state for the professional experience analyst agent.
    
    This class extends the ResumeAnalysisState with fields specific to professional experience analysis.
    """
    
    experience_analysis: Dict[str, Any] = field(default_factory=dict)
    """Detailed analysis of the candidate's professional experience."""
    
    career_progression: Dict[str, Any] = field(default_factory=dict)
    """Analysis of the candidate's career progression and trajectory."""
    
    role_relevance: Dict[str, Any] = field(default_factory=dict)
    """Assessment of the relevance of the candidate's roles to the target position.""" 