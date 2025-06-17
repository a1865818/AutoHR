"""Define the state structures for the resume ranking agent."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Sequence, Dict, Any, List

from langchain_core.messages import AnyMessage
from langgraph.graph import add_messages
from typing_extensions import Annotated


@dataclass(kw_only=True)
class InputState:
    """Defines the input state for the agent, representing a narrower interface to the outside world.

    This class is used to define the initial state and structure of incoming data.
    """

    messages: Annotated[Sequence[AnyMessage], add_messages] = field(
        default_factory=list
    )
    """
    Messages tracking the primary execution state of the agent.
    
    The `add_messages` annotation ensures that new messages are merged with existing ones,
    updating by ID to maintain an "append-only" state unless a message with the same ID is provided.
    """


@dataclass(kw_only=True)
class ResumeRankerState(InputState):
    """Represents the complete state of the resume ranking agent, extending InputState with additional attributes.

    This class stores all information needed throughout the resume ranking process.
    """

    # Input data
    job_description: str = field(default="")
    """The job description text used for ranking resumes."""
    
    company_info: str = field(default="")
    """Information about the company for cultural fit assessment."""
    
    resumes: List[Dict[str, Any]] = field(default_factory=list)
    """List of resumes to be ranked, each containing text and metadata."""
    
    # Processing state
    evaluation_criteria: List[Dict[str, Any]] = field(default_factory=list)
    """List of evaluation criteria with weights and scoring rubrics."""
    
    resume_scores: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    """Scores for each resume, indexed by resume ID."""
    
    final_rankings: List[Dict[str, Any]] = field(default_factory=list)
    """Final ranked list of resumes with scores and explanations."""
    
    conversation_log: List[str] = field(default_factory=list)
    """Log of all prompts and responses for debugging and transparency.""" 