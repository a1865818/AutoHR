"""Define the state structures for the agent."""

from langchain_core.messages import AnyMessage
from typing import Annotated
from langgraph.graph import add_messages
from dataclasses import dataclass, field
from typing import Sequence

from src.business_context_analyzer.prompts.planner_model import Plan


@dataclass(kw_only=True)
class InputState: 
    """Input state for the agent."""
    locale: str = field(default="en-US")
    plan_iterations: int = field(default=0)
    company_name: str = field(default=str)
    company_url: str = field(default=str)

@dataclass(kw_only=True)
class State(InputState):
    """State for the agent system, extends MessagesState with next field."""

    # Runtime Variables
    messages: Annotated[Sequence[AnyMessage], add_messages] = field(
        default_factory=list
    )
    observations: list[str] = field(default_factory=list)
    current_plan: Plan | str = field(default="")
    final_report: str = field(default_factory=str)
    auto_accepted_plan: bool = field(default=True)
    enable_background_investigation: bool = field(default=True)
    background_investigation_results: str = field(default_factory=str)
