"""Define the cultural fit agent graph."""

import json
import logging
from typing import Dict, Any, List, cast

from langchain_core.messages import AIMessage
from langgraph.graph import StateGraph, START, END

from src.resume_ranker.configuration import Configuration
from src.resume_ranker.resume_analysis_agent.cultural_fit.state import (
    CulturalFitState,
    CulturalFitPlanning, 
    CulturalFitScores
)
from src.resume_ranker.utils import load_chat_model, ConfigManager
from src.resume_ranker.resume_analysis_agent.prompts import cultural_fit

logger = logging.getLogger(__file__.split("langgraph_server")[1])

# Load configuration
config_manager = ConfigManager("src/configs/gpt_4.1_nano.json")
configuration = Configuration.from_runnable_config(config_manager.get("resume_ranker"))

async def plan_cultural_fit_analysis(state: CulturalFitState) -> Dict[str, Any]:
    """Plan and analyze cultural fit using a normal chat model.
    
    This node performs comprehensive cultural fit analysis without structured output constraints.
    """
    # Use config-loaded model for planning phase
    planning_model = load_chat_model(
        configuration.model, 
        configuration.provider, 
        configuration.temperature, 
        configuration.max_retries
    )
    
    # Get the resume text
    resume_text = state.current_resume.get("content", "")
    
    # Convert criteria to JSON for the prompt
    criteria_json = json.dumps(state.evaluation_criteria, indent=2)
    
    # Create comprehensive planning prompt
    planning_prompt = cultural_fit.CULTURAL_FIT_PLANNING_SYSTEM_PROMPT.format(
        resume_text=resume_text,
        company_info=state.company_info,
        criteria_json=criteria_json
    )
    
    # Get the model's response
    response = await planning_model.ainvoke(
        [
            {"role": "system", "content": cultural_fit.CULTURAL_FIT_PLANNING_SYSTEM_PROMPT},
            {"role": "user", "content": planning_prompt}
        ]
    )
    
    # Extract response content
    analysis_content = response.content if hasattr(response, 'content') else str(response)
    
    # # Log the planning interaction
    # state.conversation_log.append(f"CULTURAL_FIT_PLANNING_PROMPT: {planning_prompt}")
    # state.conversation_log.append(f"CULTURAL_FIT_PLANNING_RESPONSE: {analysis_content}")
    
    # Parse cultural indicators from the analysis
    lines = analysis_content.split('\n')
    value_indicators = []
    collaboration_indicators = []
    key_findings = []
    recommendations = []
    
    current_section = None
    for line in lines:
        line = line.strip()
        if 'value' in line.lower() and ('indicator' in line.lower() or 'evidence' in line.lower()):
            current_section = 'values'
        elif 'collaboration' in line.lower() or 'teamwork' in line.lower():
            current_section = 'collaboration'
        elif 'finding' in line.lower() or 'observation' in line.lower():
            current_section = 'findings'
        elif 'recommendation' in line.lower() or 'suggest' in line.lower():
            current_section = 'recommendations'
        elif line and line.startswith(('-', '•', '*')) and current_section:
            item = line.lstrip('-•* ')
            if current_section == 'values':
                value_indicators.append(item)
            elif current_section == 'collaboration':
                collaboration_indicators.append(item)
            elif current_section == 'findings':
                key_findings.append(item)
            elif current_section == 'recommendations':
                recommendations.append(item)
    
    # Create planning results
    planning_results = {
        "analysis": analysis_content,
        "key_findings": key_findings or ["Comprehensive cultural fit analysis completed"],
        "recommendations": recommendations or ["Ready for structured scoring"],
        "next_steps": "Proceed to structured scoring based on this analysis",
        "value_indicators": value_indicators or ["Value indicators extracted from analysis"],
        "communication_evidence": "Communication style evidence extracted from analysis",
        "collaboration_indicators": collaboration_indicators or ["Collaboration indicators extracted from analysis"]
    }
    
    return {
        "planning_results": planning_results
    }


async def structure_cultural_fit_scores(state: CulturalFitState) -> Dict[str, Any]:
    """Convert planning analysis into structured scores using Pydantic model.
    
    This node takes the planning results and generates structured scores.
    """
    # Use config-loaded model with structured output
    structuring_model = load_chat_model(
        configuration.model, 
        configuration.provider, 
        configuration.scoring_temperature, 
        configuration.max_retries
    ).with_structured_output(CulturalFitScores)
    
    # Get planning results
    planning_analysis = state.planning_results.get("analysis", "No planning analysis available")
    
    # Convert criteria to JSON for reference
    criteria_json = json.dumps(state.evaluation_criteria, indent=2)
    
    # Create structuring prompt
    structuring_prompt = cultural_fit.CULTURAL_FIT_STRUCTURING_PROMPT_TEMPLATE.format(
        planning_analysis=planning_analysis,
        company_info=state.company_info,
        criteria_json=criteria_json
    )
    
    # Get structured response
    structured_response = await structuring_model.ainvoke(
        [
            {"role": "system", "content": cultural_fit.CULTURAL_FIT_STRUCTURING_SYSTEM_PROMPT},
            {"role": "user", "content": structuring_prompt}
        ]
    )

    print(structured_response)
    
    # Log the structuring interaction
    state.conversation_log.append(f"CULTURAL_FIT_STRUCTURING_PROMPT: {structuring_prompt}")
    state.conversation_log.append(f"CULTURAL_FIT_STRUCTURING_RESPONSE: {structured_response}")
    # Extract scores from the Pydantic model

    value_alignment = structured_response["values_alignment"]
    communication_style = structured_response["communication_style"]
    collaboration_indicators = structured_response["team_collaboration"]
    innovation_markers = structured_response["work_environment_fit"]
    overal_scores = (communication_style + value_alignment + collaboration_indicators + innovation_markers) / 4

    scores = {
        "value_alignment": value_alignment,
        "communication_style": communication_style,
        "collaboration_indicators": collaboration_indicators,
        "work_environment_fit": innovation_markers,
        "overall_scores": overal_scores
    }
    
    return {
        "cultural_fit_scores": {
            "scores": scores,
            "justification": structured_response["justification"],
            "cultural_fit_analysis": planning_analysis
        }
    }

# Define the graph
def create_graph(config: Configuration) -> StateGraph:
    """Create the cultural fit agent graph."""
    builder = StateGraph(CulturalFitState)
    
    # Add nodes for two-step process
    builder.add_node("plan_analysis", plan_cultural_fit_analysis)
    builder.add_node("structure_scores", structure_cultural_fit_scores)
    
    # Define edges for two-step flow
    builder.add_edge(START, "plan_analysis")
    builder.add_edge("plan_analysis", "structure_scores")
    builder.add_edge("structure_scores", END)
    
    # Compile the graph
    return builder.compile()

# Create the graph instance with config-loaded configuration
graph = create_graph(configuration) 