# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from .coordinator import COORDINATOR_PROMPT
from .planner import PLANNER_PROMPT
from .reporter import REPORTER_PROMPT
from .researcher import RESEARCHER_PROMPT


def get_prompt_template(prompt_name: str) -> str:
    """
    Load and return a prompt template using Jinja2.

    Args:
        prompt_name: Name of the prompt template file (without .md extension)

    Returns:
        The template string with proper variable substitution syntax
    """
    mapping = {
        "coordinator": COORDINATOR_PROMPT,
        "planner": PLANNER_PROMPT,
        "reporter": REPORTER_PROMPT,
        "researcher": RESEARCHER_PROMPT,
    }
    return mapping[prompt_name]

__all__ = [
    "COORDINATOR_PROMPT",
    "PLANNER_PROMPT",
    "REPORTER_PROMPT",
    "RESEARCHER_PROMPT",
]
