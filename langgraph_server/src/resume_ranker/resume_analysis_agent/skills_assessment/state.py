"""Define the state structures for the skills assessment agent."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from src.resume_ranker.resume_analysis_agent.state import ResumeAnalysisState
from src.resume_ranker.resume_analysis_agent.state import PlanningResponse


# Skills Assessment Pydantic Models
class SkillsAssessmentScores:
    """Structured scores for skills assessment analysis."""
    technical_skills_match: float = Field(ge=1, le=5, description="Match of technical skills to requirements")
    skill_proficiency_level: float = Field(ge=1, le=5, description="Demonstrated proficiency level")
    soft_skills_demonstration: float = Field(ge=1, le=5, description="Evidence of soft skills")
    learning_adaptability: float = Field(ge=1, le=5, description="Demonstrated learning and adaptability")
    justification: str = Field(description="Reasoning process for the scores")


class SkillsAssessmentPlanning(PlanningResponse):
    """Planning response for skills assessment analysis."""
    technical_skills_inventory: List[str] = Field(description="List of identified technical skills")
    soft_skills_inventory: List[str] = Field(description="List of identified soft skills")
    skill_gaps: List[str] = Field(description="Identified skill gaps relative to job requirements")
    skill_strengths: List[str] = Field(description="Key skill strengths")


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
    
    # Planning phase results
    planning_results: Dict[str, Any] = field(default_factory=dict)
    """Results from the planning phase analysis.""" 