"""Define the configurable parameters for the resume analysis agent."""

from __future__ import annotations

from dataclasses import dataclass, field

from src.resume_ranker.configuration import BaseConfiguration


@dataclass(kw_only=True)
class ResumeAnalysisConfiguration(BaseConfiguration):
    """The configuration for the resume analysis agent."""

    scoring_temperature: float = field(
        default=0.0,
        metadata={
            "description": "The temperature to use for scoring to ensure consistency."
        },
    )
    
    parallel_analysis: bool = field(
        default=True,
        metadata={
            "description": "Whether to analyze different aspects of resumes in parallel."
        }
    )
    
    professional_experience_weight: float = field(
        default=0.35,
        metadata={
            "description": "Default weight for professional experience if not specified in criteria."
        }
    )
    
    skills_assessment_weight: float = field(
        default=0.35,
        metadata={
            "description": "Default weight for skills assessment if not specified in criteria."
        }
    )
    
    education_growth_weight: float = field(
        default=0.15,
        metadata={
            "description": "Default weight for education and growth if not specified in criteria."
        }
    )
    
    cultural_fit_weight: float = field(
        default=0.15,
        metadata={
            "description": "Default weight for cultural fit if not specified in criteria."
        }
    ) 