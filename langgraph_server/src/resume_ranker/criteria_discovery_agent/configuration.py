"""Define the configurable parameters for the criteria discovery agent."""

from __future__ import annotations

from dataclasses import dataclass, field

from src.resume_ranker.configuration import BaseConfiguration


@dataclass(kw_only=True)
class CriteriaDiscoveryConfiguration(BaseConfiguration):
    """The configuration for the criteria discovery agent."""

    job_intelligence_temperature: float = field(
        default=0.0,
        metadata={
            "description": "The temperature to use for job intelligence analysis."
        },
    )
    
    criteria_synthesis_temperature: float = field(
        default=0.2,
        metadata={
            "description": "The temperature to use for criteria synthesis to allow some creativity."
        },
    )
    
    min_criteria: int = field(
        default=6,
        metadata={
            "description": "The minimum number of evaluation criteria to generate."
        }
    )
    
    max_criteria: int = field(
        default=12,
        metadata={
            "description": "The maximum number of evaluation criteria to generate."
        }
    ) 