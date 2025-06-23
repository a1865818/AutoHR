"""Define the state structures for the resume ranking agent."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Sequence, Dict, Any, List
import operator

from langchain_core.messages import AnyMessage
from langgraph.graph import add_messages
from typing_extensions import Annotated
from operator import add


@dataclass(kw_only=True)
class InputState:
    """Defines the input state for the agent, representing a narrower interface to the outside world.

    This class is used to define the initial state and structure of incoming data.
    """
    
    job_description: str = field(default="")
    """The job description text used for ranking resumes."""
    
    company_info: str = field(default="")
    """Analysis and information about the company for cultural fit assessment."""
    
    resume_bucket_name: str = field(default="")
    """The name of the bucket containing resume files."""
    
    resume_file_names: List[str] = field(default_factory=list)
    """List of resume file names to download and analyze."""

@dataclass(kw_only=True)
class OutputState:
    """Defines the output state for the agent, representing a narrower interface to the outside world.
    
    This class is used to define the output state and structure of outgoing data.
    """
    
    final_rankings: list[Dict[str, int]] = field(default_factory=list)
    """Final ranked list of resumes with scores and explanations."""

    final_resume_output: list[Dict[str, Any]] = field(default_factory=list)
    """Final output of the resume ranking agent."""



@dataclass(kw_only=True)
class ResumeRankerState(InputState):
    """Represents the complete state of the resume ranking agent, extending InputState with additional attributes.

    This class stores all information needed throughout the resume ranking process.
    """
    resume_scores: Annotated[List[Dict[str, float]], add] = field(default_factory=list)
    """Scores for each resume, indexed by resume ID."""

    resume_outputs: Annotated[List[Dict[str, Any]], add] = field(default_factory=list)

    resume_rankings: list[Dict[str, int]] = field(default_factory=list)
    
    resumes: List[Dict[str, Any]] = field(default_factory=list)
    """List of resumes to be ranked, each containing text and metadata."""
    
    current_resume: Dict[str, Any] = field(default_factory=dict)
    """Current resume being processed (used for parallel processing)."""
    
    # Processing state
    evaluation_criteria: Dict[str, Any] = field(default_factory=dict)
    """List of evaluation criteria with weights and scoring rubrics."""
  
    conversation_log: List[str] = field(default_factory=list)
    """Log of all prompts and responses for debugging and transparency.""" 

    messages: Annotated[Sequence[AnyMessage], add_messages] = field(
        default_factory=list
    )