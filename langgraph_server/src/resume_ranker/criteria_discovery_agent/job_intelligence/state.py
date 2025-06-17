"""Define the state structures for the job intelligence agent."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Any

from src.resume_ranker.criteria_discovery_agent.state import CriteriaDiscoveryState


@dataclass(kw_only=True)
class JobIntelligenceState(CriteriaDiscoveryState):
    """Represents the state for the job intelligence agent.
    
    This class extends the CriteriaDiscoveryState with fields specific to job intelligence analysis.
    """
    
    technical_requirements: Dict[str, Any] = field(default_factory=dict)
    """Extracted technical requirements from the job description."""
    
    soft_skills_requirements: Dict[str, Any] = field(default_factory=dict)
    """Extracted soft skills requirements from the job description."""
    
    experience_requirements: Dict[str, Any] = field(default_factory=dict)
    """Extracted experience requirements from the job description."""
    
    role_impact: Dict[str, Any] = field(default_factory=dict)
    """Analysis of the role's impact and criticality.""" 