"""Define the state structures for the criteria synthesis agent."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Any, List

from src.resume_ranker.criteria_discovery_agent.state import CriteriaDiscoveryState


@dataclass(kw_only=True)
class CriteriaSynthesisState(CriteriaDiscoveryState):
    """Represents the state for the criteria synthesis agent.
    
    This class extends the CriteriaDiscoveryState with fields specific to criteria synthesis.
    """
    
    raw_criteria: List[Dict[str, Any]] = field(default_factory=list)
    """Raw criteria generated from the job analysis."""
    
    validated_criteria: List[Dict[str, Any]] = field(default_factory=list)
    """Validated criteria after checking for completeness and consistency.""" 