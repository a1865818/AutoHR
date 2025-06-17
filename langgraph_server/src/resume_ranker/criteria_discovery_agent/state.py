"""Define the state structures for the criteria discovery agent."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Any, List

from src.resume_ranker.state import ResumeRankerState


@dataclass(kw_only=True)
class CriteriaDiscoveryState(ResumeRankerState):
    """Represents the state for the criteria discovery agent.
    
    This class extends the ResumeRankerState with fields specific to criteria discovery.
    """
    
    job_analysis: Dict[str, Any] = field(default_factory=dict)
    """Analysis of the job description."""
    
    draft_criteria: List[Dict[str, Any]] = field(default_factory=list)
    """Draft evaluation criteria before final synthesis.""" 