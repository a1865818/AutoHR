"""Define the state structures for the criteria synthesis agent."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from src.resume_ranker.criteria_discovery_agent.state import CriteriaDiscoveryState


class EvaluationCriterion(BaseModel):
    """Single evaluation criterion with rubric and weight."""
    
    name: str = Field(description="Name of the evaluation criterion")
    description: str = Field(description="Detailed description of what this criterion evaluates")
    weight: float = Field(description="Weight of this criterion (should sum to 1.0 across all criteria)")


class CriteriaSynthesisStructured(BaseModel):
    """Structured output model for criteria synthesis results."""
    
    evaluation_criteria: List[EvaluationCriterion] = Field(
        description="List of weighted evaluation criteria with scoring rubrics"
    )
        
    criteria_summary: str = Field(
        description="Summary of criteria categories and their focus areas"
    )


@dataclass(kw_only=True)
class CriteriaSynthesisState(CriteriaDiscoveryState):
    """Represents the state for the criteria synthesis agent.
    
    This class extends the CriteriaDiscoveryState with fields specific to criteria synthesis.
    """
    
    # Planning phase results
    planning_results: str = field(default_factory=str)
    """Results from the planning and strategy phase."""
    
    validated_criteria: List[Dict[str, Any]] = field(default_factory=list)
    """Validated criteria after checking for completeness and consistency."""
    
    criteria_summary: str = field(default_factory=str)
    """Summary of criteria categories and their focus areas.""" 