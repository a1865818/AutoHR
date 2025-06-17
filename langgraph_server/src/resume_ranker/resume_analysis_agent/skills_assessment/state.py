"""Define the state structures for the skills assessment agent."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Any, List

from src.resume_ranker.resume_analysis_agent.state import ResumeAnalysisState


@dataclass(kw_only=True)
class SkillsAssessmentState(ResumeAnalysisState):
    """Represents the state for the skills assessment agent.
    
    This class extends the ResumeAnalysisState with fields specific to skills assessment.
    """
    
    technical_skills: Dict[str, Any] = field(default_factory=dict)
    """Extracted technical skills with proficiency levels."""
    
    soft_skills: Dict[str, Any] = field(default_factory=dict)
    """Extracted soft skills with evidence."""
    
    skills_relevance: Dict[str, float] = field(default_factory=dict)
    """Assessment of the relevance of each skill to the job requirements.""" 