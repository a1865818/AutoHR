"""Define the job intelligence agent graph."""

import json
import logging
from typing import Dict, Any, cast

from langchain_core.messages import AIMessage
from langgraph.graph import StateGraph, START, END

from src.resume_ranker.configuration import Configuration
from src.resume_ranker.criteria_discovery_agent.state import CriteriaDiscoveryState
from src.resume_ranker.criteria_discovery_agent.job_intelligence.state import JobIntelligenceState, JobAnalysisStructured
from src.resume_ranker.utils import load_chat_model, ConfigManager
from src.resume_ranker.criteria_discovery_agent.prompts import job_intelligence

logger = logging.getLogger(__file__.split("langgraph_server")[1])

# Load configuration
config_manager = ConfigManager("src/configs/gpt_4.1_nano.json")
configuration = Configuration.from_runnable_config(config_manager.get("resume_ranker"))

# Create model instance
job_intelligence_model = load_chat_model(configuration.model, configuration.provider, configuration.temperature, configuration.max_retries)

async def plan_job_analysis(state: JobIntelligenceState) -> Dict[str, Any]:
    """Plan and execute comprehensive job description analysis.
    
    This node develops an analysis strategy and performs a thorough job description analysis
    without the constraints of structured output.
    """
    # Use pre-configured model instance for planning phase
    
    # Create comprehensive planning and analysis prompt
    planning_prompt = job_intelligence.PLANNING_PROMPT_TEMPLATE.format(
        job_description=state.job_description,
        company_info=state.company_info or "No specific company information provided"
    )
    
    # Get the model's response
    response = cast(
        AIMessage,
        await job_intelligence_model.ainvoke(
            [
                {"role": "system", "content": job_intelligence.SYSTEM_PROMPT},
                {"role": "user", "content": planning_prompt}
            ]
        ),
    )
    
    # Extract response content
    analysis_content = response.content if hasattr(response, 'content') else str(response)

    return {
        "job_analysis": analysis_content,
        "messages": [response]
    }


async def structure_job_analysis(state: JobIntelligenceState) -> Dict[str, Any]:
    """Convert comprehensive analysis into structured JSON format.
    
    This node takes the planning results and generates structured data using Pydantic model.
    """
    # Create model with structured output using config
    structuring_model = load_chat_model(
        configuration.model, 
        configuration.provider, 
        configuration.temperature, 
        configuration.max_retries
    ).with_structured_output(JobAnalysisStructured)
    
    # Get planning analysis
    job_analysis = state.job_analysis

    # Get structured response
    structured_response = await structuring_model.ainvoke(
        [
            {"role": "system", "content": job_intelligence.SYSTEM_PROMPT},
            {"role": "user", "content": job_intelligence.STRUCTURING_PROMPT_TEMPLATE.format(job_analysis=job_analysis)}
        ]
    )

    # Return the updated state with all structured information
    return {
        "technical_requirements": structured_response.technical_requirements,
        "soft_skills_requirements": structured_response.soft_skills_requirements,
        "experience_requirements": structured_response.experience_requirements,
        "role_impact": structured_response.role_impact
    }

# Define the graph
def create_graph(config: Configuration) -> StateGraph:
    """Create the job intelligence agent graph with two-node architecture."""
    builder = StateGraph(JobIntelligenceState)
    
    # Add nodes - LangGraph will handle async functions properly
    builder.add_node("plan_job_analysis", plan_job_analysis)
    builder.add_node("structure_job_analysis", structure_job_analysis)
    
    # Define edges - sequential flow from planning to structuring
    builder.add_edge(START, "plan_job_analysis")
    builder.add_edge("plan_job_analysis", "structure_job_analysis")
    builder.add_edge("structure_job_analysis", END)
    
    # Compile the graph
    return builder.compile()

# Create the graph instance with config-loaded configuration
graph = create_graph(configuration) 
graph.name = "job_intelligence_graph"