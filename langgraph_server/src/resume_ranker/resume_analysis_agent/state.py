"""Define the state structures for the resume analysis agent."""

from __future__ import annotations

from dataclasses import dataclass, field
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from typing_extensions import Annotated
import operator

from src.resume_ranker.state import ResumeRankerState
from src.resume_ranker.criteria_discovery_agent.state import CriteriaDiscoveryState


class PlanningResponse(BaseModel):
    """Model for unstructured planning and analysis responses."""
    analysis: str = Field(description="Detailed analysis and reasoning")
    key_findings: List[str] = Field(description="Key findings from the analysis")
    recommendations: List[str] = Field(description="Recommendations based on analysis")
    next_steps: str = Field(description="Suggested next steps for evaluation")


# Define individual analyst task state for Send operations
class AnalystTask:
    """Individual analyst task state for parallel processing via Send."""
    
    analyst_type: str
    """Type of analyst (professional_experience, skills_assessment, etc.)"""

    
    criteria: List[Dict[str, Any]] = field(default_factory=list)
    """Relevant criteria for this analyst"""


@dataclass 
class ResumeAnalysisState(CriteriaDiscoveryState):
    """State for the resume analysis agent with Send map-reduce support."""

    
    resume_format: str = ""
    """Format of the resume (PDF, TXT, etc.)."""
    
    # Parallel analyst results - using Annotated[list, operator.add] as reducers
    analyst_results: Annotated[List[Dict[str, Any]], operator.add] = field(default_factory=list)
    """Aggregated results from all parallel analyst nodes."""
    
    professional_experience_scores: Dict[str, Any] = field(default_factory=dict)
    """Scores and analysis from professional experience analyst."""
    
    skills_assessment_scores: Dict[str, Any] = field(default_factory=dict)
    """Scores and analysis from skills assessment analyst."""
    
    education_growth_scores: Dict[str, Any] = field(default_factory=dict)
    """Scores and analysis from education and growth analyst."""
    
    cultural_fit_scores: Dict[str, Any] = field(default_factory=dict)
    """Scores and analysis from cultural fit analyst."""
    
    # Planning results for each analyst type
    professional_experience_planning: Dict[str, Any] = field(default_factory=dict)
    """Planning and analysis results for professional experience."""
    
    skills_assessment_planning: Dict[str, Any] = field(default_factory=dict)
    """Planning and analysis results for skills assessment."""
    
    education_growth_planning: Dict[str, Any] = field(default_factory=dict)
    """Planning and analysis results for education and growth."""
    
    cultural_fit_planning: Dict[str, Any] = field(default_factory=dict)
    """Planning and analysis results for cultural fit."""
    
    # Final aggregated results
    final_score: float = 0.0
    """Final aggregated score for the resume."""
    
    detailed_feedback: str = ""
    """Detailed feedback and recommendations."""
    
    score_breakdown: Dict[str, Any] = field(default_factory=dict)
    """Breakdown of scores by category."""
    
    recommendations: List[str] = field(default_factory=list)
    """List of recommendations for the candidate.""" 