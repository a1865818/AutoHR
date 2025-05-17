"""Define the state structures for the agent."""

from dataclasses import dataclass, field
from typing import Sequence, Dict, List, Any

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
    """


@dataclass(kw_only=True)
class State(InputState):
    """Represents the complete state of the agent, extending InputState with additional attributes.

    This class can be used to store any information needed throughout the agent's lifecycle.
    """
    """
    Indicates whether the current step is the last one before the graph raises an error.

    This is a 'managed' variable, controlled by the state machine rather than user code.
    It is set to 'True' when the step count reaches recursion_limit - 1.
    """

    # Business context analyzer specific fields
    discovered_urls: List[Dict[str, Any]] = field(default_factory=list)
    """List of dictionaries containing discovered URLs and their content from the company website."""
    
    company_name: str = field(default="")
    """Name of the company being analyzed."""
    
    company_website: str = field(default="")
    """URL of the company website."""

    analysis_result: Dict[str, Any] = field(default_factory=dict)
    """Structured analysis data about the company."""
    
    source_count: int = field(default=0)
    """Number of sources used for the analysis."""
    
    business_context: Dict[str, Any] = field(default_factory=dict)
    """Final business context output with company name and description."""
