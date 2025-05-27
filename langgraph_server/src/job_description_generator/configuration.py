"""Define the configurable parameters for the agent."""

from __future__ import annotations

from dataclasses import dataclass, field, fields
from typing import Type, TypeVar

from langchain_core.runnables import ensure_config
from langchain_core.runnables import RunnableConfig

T = TypeVar("T", bound="BaseConfiguration")

@dataclass(kw_only=True)
class BaseConfiguration:
    """The base configuration for the agent."""

    @classmethod
    def from_runnable_config(cls: Type[T], config: RunnableConfig) -> T:
        """Create a Configuration instance from a RunnableConfig object."""
        config = ensure_config(config)
        configurable = config.get("configurable") or {}
        _fields = {f.name for f in fields(cls) if f.init}
        return cls(**{k: v for k, v in configurable.items() if k in _fields})

@dataclass(kw_only=True)
class Configuration(BaseConfiguration):
    """The configuration for the agent."""

    model: str = field(
        default="anthropic/claude-3-5-sonnet-20240620",
        metadata={
            "description": "The name of the language model to use for the agent's main interactions. "
            "Should be in the form: provider/model-name."
        },
    )
    
    provider: str = field(
        default="anthropic",
        metadata={
            "description": "The provider to use for the language model."
        },
    )

    max_search_results: int = field(
        default=10,
        metadata={
            "description": "The maximum number of search results to return for each search query."
        },
    )

    temperature: float = field(
        default=0.0,
        metadata={
            "description": "The temperature to use for the language model."
        },
    )
    max_retries: int = field(
        default=3,
        metadata={
            "description": "The maximum number of retries for the agent's interactions."
        },
    )

    max_revisions: int = field(
        default=3,
        metadata={
            "description": "The maximum number of revisions allowed for the job description."
        }
    )

