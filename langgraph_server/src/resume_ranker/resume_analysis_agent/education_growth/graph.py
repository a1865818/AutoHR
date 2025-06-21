"""Define the education and growth agent graph."""

import json
import logging
from typing import Dict, Any, List, cast

from langchain_core.messages import AIMessage
from langgraph.graph import StateGraph, START, END

from src.resume_ranker.configuration import Configuration
from src.resume_ranker.resume_analysis_agent.education_growth.state import (
    EducationGrowthState,
    EducationGrowthPlanning, 
    EducationGrowthScores
)
from src.resume_ranker.utils import load_chat_model, ConfigManager
from src.resume_ranker.resume_analysis_agent.prompts import education_growth

logger = logging.getLogger(__file__.split("langgraph_server")[1])

# Load configuration
config_manager = ConfigManager("src/configs/gpt_4.1_nano.json")
configuration = Configuration.from_runnable_config(config_manager.get("resume_ranker"))

async def plan_education_growth_analysis(state: EducationGrowthState) -> Dict[str, Any]:
    """Plan and analyze education and growth using a normal chat model.
    
    This node performs comprehensive education and professional development analysis.
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
    planning_prompt = education_growth.EDUCATION_GROWTH_PROMPT_TEMPLATE.format(
        resume_text=resume_text,
        criteria_json=criteria_json
    )
    
    # Get the model's response
    response = await planning_model.ainvoke(
        [
            {"role": "system", "content": education_growth.EDUCATION_GROWTH_PROMPT_TEMPLATE},
            {"role": "user", "content": planning_prompt}
        ]
    )
    
    # Extract response content
    analysis_content = response.content if hasattr(response, 'content') else str(response)
    
    # Log the planning interaction
    state.conversation_log.append(f"EDUCATION_GROWTH_PLANNING_PROMPT: {planning_prompt}")
    state.conversation_log.append(f"EDUCATION_GROWTH_PLANNING_RESPONSE: {analysis_content}")
    
    # Parse key findings from the analysis
    lines = analysis_content.split('\n')
    key_findings = []
    recommendations = []
    
    current_section = None
    for line in lines:
        line = line.strip()
        if 'finding' in line.lower() or 'observation' in line.lower():
            current_section = 'findings'
        elif 'recommendation' in line.lower() or 'suggest' in line.lower():
            current_section = 'recommendations'
        elif line and line.startswith(('-', '•', '*')) and current_section:
            if current_section == 'findings':
                key_findings.append(line.lstrip('-•* '))
            elif current_section == 'recommendations':
                recommendations.append(line.lstrip('-•* '))
    
    # Create planning results
    planning_results = {
        "analysis": analysis_content,
        "key_findings": key_findings or ["Comprehensive education and growth analysis completed"],
        "recommendations": recommendations or ["Ready for structured scoring"],
        "next_steps": "Proceed to structured scoring based on this analysis",
        "formal_education": "Formal education analysis extracted from full analysis",
        "certifications_analysis": "Certifications analysis extracted from full analysis",
        "learning_trajectory": "Learning trajectory analysis extracted from full analysis"
    }
    
    return {
        "planning_results": planning_results
    }


async def structure_education_growth_scores(state: EducationGrowthState) -> Dict[str, Any]:
    """Convert planning analysis into structured scores using Pydantic model.
    
    This node takes the planning results and generates structured scores.
    """
    # Use config-loaded model with structured output
    structuring_model = load_chat_model(
        configuration.model, 
        configuration.provider, 
        configuration.scoring_temperature, 
        configuration.max_retries
    ).with_structured_output(EducationGrowthScores)
    
    # Get planning results
    planning_analysis = state.planning_results.get("analysis", "No planning analysis available")
    
    # Convert criteria to JSON for reference
    criteria_json = json.dumps(state.evaluation_criteria, indent=2)
    
    # Create structuring prompt
    structuring_prompt = education_growth.EDUCATION_GROWTH_STRUCTURING_PROMPT_TEMPLATE.format(
        planning_analysis=planning_analysis,
        criteria_json=criteria_json
    )
    
    # Get structured response
    structured_response = await structuring_model.ainvoke(
        [
            {"role": "system", "content": education_growth.EDUCATION_GROWTH_STRUCTURING_SYSTEM_PROMPT},
            {"role": "user", "content": structuring_prompt}
        ]
    )

    # Log the structuring interaction
    state.conversation_log.append(f"EDUCATION_GROWTH_STRUCTURING_PROMPT: {structuring_prompt}")
    state.conversation_log.append(f"EDUCATION_GROWTH_STRUCTURING_RESPONSE: {structured_response}")
    
    education_growth_scores = structured_response["educational_background"]
    certifications_relevance = structured_response["certifications_relevance"]
    continuous_learning = structured_response["continuous_learning"]
    professional_development = structured_response["professional_development"]
    knowledge_application = structured_response["knowledge_application"]

    overal_scores = (education_growth_scores + certifications_relevance + continuous_learning + professional_development + knowledge_application) / 5
    
    scores = {
        "educational_background": education_growth_scores,
        "certifications_relevance": certifications_relevance,
        "continuous_learning": continuous_learning,
        "professional_development": professional_development,
        "knowledge_application": knowledge_application,
        "overall_scores": overal_scores
    }
    
    return {
        "education_growth_scores": {
            "scores": scores,
            "justification": structured_response["justification"],
            "education_analysis": planning_analysis
        }
    }

# Define the graph
def create_graph(config: Configuration) -> StateGraph:
    """Create the education and growth agent graph."""
    builder = StateGraph(EducationGrowthState)
    
    # Add nodes for two-step process
    builder.add_node("plan_analysis", plan_education_growth_analysis)
    builder.add_node("structure_scores", structure_education_growth_scores)
    
    # Define edges for two-step flow
    builder.add_edge(START, "plan_analysis")
    builder.add_edge("plan_analysis", "structure_scores")
    builder.add_edge("structure_scores", END)
    
    # Compile the graph
    return builder.compile()

# Create the graph instance with config-loaded configuration
graph = create_graph(configuration) 