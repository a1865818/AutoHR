"""Define the state structures for the job intelligence agent."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Any, Optional, Annotated, List
from operator import add
from pydantic import BaseModel, Field

from src.resume_ranker.criteria_discovery_agent.state import CriteriaDiscoveryState


# Pydantic Models for Structured Output
class JobAnalysisStructured(BaseModel):
    """Structured output model for job analysis results."""
    
    technical_requirements: list[str] = Field(
        description="Technical skills and requirements extracted from job description"
    )
    
    soft_skills_requirements: list[str] = Field(
        description="Soft skills and behavioral requirements from job description"
    )
    
    experience_requirements: list[str] = Field(
        description="Experience level and background requirements"
    )
    
    role_impact: list[str] = Field(
        description="Analysis of role impact, scope, and criticality"
    )
    
    key_priorities: list[str] = Field(
        description="Key priorities and success factors for the role"
    )


@dataclass(kw_only=True)
class JobIntelligenceState(CriteriaDiscoveryState):
    """Represents the state for the job intelligence agent.
    """
    
    technical_requirements: Dict[str, Any] = field(default_factory=dict)
    """Extracted technical requirements from the job description."""
    
    soft_skills_requirements: Dict[str, Any] = field(default_factory=dict)
    """Extracted soft skills requirements from the job description."""
    
    experience_requirements: Dict[str, Any] = field(default_factory=dict)
    """Extracted experience requirements from the job description."""
    
    role_impact: Dict[str, Any] = field(default_factory=dict)
    """Analysis of the role's impact and criticality.""" 