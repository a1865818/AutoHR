"""Define the state structures for the resume analysis agent."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Any, List

from src.resume_ranker.state import ResumeRankerState


@dataclass(kw_only=True)
class ResumeAnalysisState(ResumeRankerState):
    """Represents the state for the resume analysis agent.
    
    This class extends the ResumeRankerState with fields specific to resume analysis.
    """
    
    current_resume: Dict[str, Any] = field(default_factory=dict)
    """The current resume being analyzed."""
    
    professional_experience_scores: Dict[str, Any] = field(default_factory=dict)
    """Scores and justifications for professional experience criteria."""
    
    skills_assessment_scores: Dict[str, Any] = field(default_factory=dict)
    """Scores and justifications for skills assessment criteria."""
    
    education_growth_scores: Dict[str, Any] = field(default_factory=dict)
    """Scores and justifications for education and growth criteria."""
    
    cultural_fit_scores: Dict[str, Any] = field(default_factory=dict)
    """Scores and justifications for cultural fit criteria."""
    
    aggregate_scores: Dict[str, Any] = field(default_factory=dict)
    """Aggregated scores across all evaluation dimensions.""" 