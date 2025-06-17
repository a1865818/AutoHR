"""Define the state structures for the education and growth agent."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Any, List

from src.resume_ranker.resume_analysis_agent.state import ResumeAnalysisState


@dataclass(kw_only=True)
class EducationGrowthState(ResumeAnalysisState):
    """Represents the state for the education and growth agent.
    
    This class extends the ResumeAnalysisState with fields specific to education and growth assessment.
    """
    
    education: Dict[str, Any] = field(default_factory=dict)
    """Extracted education information with relevance assessment."""
    
    certifications: List[Dict[str, Any]] = field(default_factory=list)
    """Extracted certifications with currency assessment."""
    
    continuous_learning: Dict[str, Any] = field(default_factory=dict)
    """Assessment of continuous learning patterns and professional development.""" 