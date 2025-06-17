"""Define the state structures for the cultural fit agent."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Any, List

from src.resume_ranker.resume_analysis_agent.state import ResumeAnalysisState


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