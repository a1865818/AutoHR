"""Define the state structures for the criteria discovery agent."""

from dataclasses import dataclass, field
from typing import Dict, Any, List, Annotated
from operator import add

from src.resume_ranker.state import ResumeRankerState


@dataclass(kw_only=True)
class CriteriaDiscoveryState(ResumeRankerState):
    """State for the criteria discovery agent.
    
    This class extends the ResumeRankerState with fields specific to criteria discovery.
    """
    
    job_analysis: str = field(default_factory=str)
    """Analysis of the job description."""
    
    validated_criteria: List[Dict[str, Any]] = field(default_factory=list)
    """Validated evaluation criteria before final synthesis.""" 

    messages: Annotated[List[Dict[str, Any]], add] = field(default_factory=list)
    """Messages from the criteria discovery agent."""