"""Define the job intelligence agent graph."""

import json
import logging
from typing import Dict, Any, cast

from langchain_core.messages import AIMessage
from langgraph.graph import StateGraph, START, END

from src.resume_ranker.configuration import Configuration
from src.resume_ranker.criteria_discovery_agent.job_intelligence.state import JobIntelligenceState
from src.resume_ranker.utils import load_chat_model
import src.resume_ranker.prompts as prompts

logger = logging.getLogger(__file__.split("langgraph_server")[1])

async def analyze_job_description(state: JobIntelligenceState) -> Dict[str, Any]:
    """Analyze the job description to extract requirements and priorities.
    
    This node performs a deep analysis of the job description to identify explicit and implicit requirements,
    experience level, role criticality, and other key factors.
    """
    # Load model based on configuration
    job_intelligence_model = load_chat_model(
        state.model, 
        state.provider, 
        state.job_intelligence_temperature, 
        state.max_retries
    )
    
    # Format the prompt
    prompt = prompts.JOB_INTELLIGENCE_PROMPT_TEMPLATE.format(
        job_description=state.job_description
    )
    
    # Get the model's response
    response = cast(
        AIMessage,
        await job_intelligence_model.ainvoke(
            [
                {"role": "system", "content": prompts.JOB_INTELLIGENCE_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ]
        ),
    )
    
    # Log the prompt and response for debugging
    state.conversation_log.append(f"JOB_INTELLIGENCE_PROMPT: {prompt}")
    state.conversation_log.append(f"JOB_INTELLIGENCE_RESPONSE: {response.content}")
    
    # Update state with analysis
    job_analysis = {
        "full_analysis": response.content,
    }
    
    # Extract structured information from the analysis (this is a simplified version)
    # In a real implementation, you might use more sophisticated parsing or a structured output model
    analysis_lines = response.content.split("\n")
    technical_requirements = {}
    soft_skills_requirements = {}
    experience_requirements = {}
    role_impact = {}
    
    current_section = None
    for line in analysis_lines:
        line = line.strip()
        if not line:
            continue
            
        if "technical skills" in line.lower():
            current_section = "technical"
        elif "soft skills" in line.lower() or "behavioral" in line.lower():
            current_section = "soft"
        elif "experience" in line.lower():
            current_section = "experience"
        elif "impact" in line.lower() or "scope" in line.lower():
            current_section = "impact"
        elif current_section == "technical" and line.startswith("-"):
            key = line.strip("- ").split(":")[0] if ":" in line else line.strip("- ")
            value = line.split(":", 1)[1].strip() if ":" in line else "Required"
            technical_requirements[key] = value
        elif current_section == "soft" and line.startswith("-"):
            key = line.strip("- ").split(":")[0] if ":" in line else line.strip("- ")
            value = line.split(":", 1)[1].strip() if ":" in line else "Required"
            soft_skills_requirements[key] = value
        elif current_section == "experience" and line.startswith("-"):
            key = line.strip("- ").split(":")[0] if ":" in line else line.strip("- ")
            value = line.split(":", 1)[1].strip() if ":" in line else "Required"
            experience_requirements[key] = value
        elif current_section == "impact" and line.startswith("-"):
            key = line.strip("- ").split(":")[0] if ":" in line else line.strip("- ")
            value = line.split(":", 1)[1].strip() if ":" in line else "High"
            role_impact[key] = value
    
    # Return the updated state
    return {
        "job_analysis": job_analysis,
        "technical_requirements": technical_requirements,
        "soft_skills_requirements": soft_skills_requirements,
        "experience_requirements": experience_requirements,
        "role_impact": role_impact
    }

# Define the graph
def create_graph(config: Configuration) -> StateGraph:
    """Create the job intelligence agent graph."""
    builder = StateGraph(JobIntelligenceState)
    
    # Add nodes
    builder.add_node("analyze_job_description", analyze_job_description)
    
    # Define edges
    builder.add_edge(START, "analyze_job_description")
    builder.add_edge("analyze_job_description", END)
    
    # Compile the graph
    return builder.compile()

# Create the graph instance
graph = create_graph(Configuration()) 