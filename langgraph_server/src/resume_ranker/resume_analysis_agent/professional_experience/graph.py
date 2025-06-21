"""Define the professional experience analyst agent graph."""

import json
import logging
from typing import Dict, Any, cast

from langchain_core.messages import AIMessage
from langgraph.graph import StateGraph, START, END

from src.resume_ranker.configuration import Configuration
from src.resume_ranker.resume_analysis_agent.professional_experience.state import (
    ProfessionalExperienceState, 
    ProfessionalExperiencePlanning, 
    ProfessionalExperienceScores
)
from src.resume_ranker.utils import load_chat_model, ConfigManager
from src.resume_ranker.resume_analysis_agent.prompts import professional_experience

logger = logging.getLogger(__file__.split("langgraph_server")[1])

# Load configuration
config_manager = ConfigManager("src/configs/gpt_4.1_nano.json")
configuration = Configuration.from_runnable_config(config_manager.get("resume_ranker"))


async def plan_professional_experience_analysis(state: ProfessionalExperienceState) -> Dict[str, Any]:
    """Plan and analyze professional experience using a normal chat model.
    
    This node performs comprehensive analysis and planning without structured output constraints.
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
    planning_prompt = professional_experience.PROFESSIONAL_EXPERIENCE_PROMPT_TEMPLATE.format(
        resume_text=resume_text,
        criteria_json=criteria_json
    )
    
    # Get the model's response
    response = await planning_model.ainvoke(
        [
            {"role": "system", "content": professional_experience.PROFESSIONAL_EXPERIENCE_PLANNING_SYSTEM_PROMPT},
            {"role": "user", "content": planning_prompt}
        ]
    )
    
    # Extract response content
    analysis_content = response.content if hasattr(response, 'content') else str(response)
    
    # Log the planning interaction
    state.conversation_log.append(f"PROFESSIONAL_EXPERIENCE_PLANNING_PROMPT: {planning_prompt}")
    state.conversation_log.append(f"PROFESSIONAL_EXPERIENCE_PLANNING_RESPONSE: {analysis_content}")
    
    # Parse key findings and recommendations from the analysis
    # This is a simplified parsing - you might want more sophisticated NLP
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
        "key_findings": key_findings or ["Comprehensive experience analysis completed"],
        "recommendations": recommendations or ["Ready for structured scoring"],
        "next_steps": "Proceed to structured scoring based on this analysis",
        "experience_timeline": "Timeline analysis extracted from full analysis",
        "role_alignment": "Role alignment assessment extracted from full analysis", 
        "skill_development_path": "Skill development path extracted from full analysis"
    }
    
    return {
        "planning_results": planning_results
    }


async def structure_professional_experience_scores(state: ProfessionalExperienceState) -> Dict[str, Any]:
    """Convert planning analysis into structured scores using Pydantic model.
    
    This node takes the planning results and generates structured scores.
    """
    # Use config-loaded model with structured output
    structuring_model = load_chat_model(
        configuration.model, 
        configuration.provider, 
        configuration.scoring_temperature, 
        configuration.max_retries
    ).with_structured_output(ProfessionalExperienceScores)
    
    # Get planning results
    planning_analysis = state.planning_results.get("analysis", "No planning analysis available")
    
    # Convert criteria to JSON for reference
    criteria_json = json.dumps(state.evaluation_criteria, indent=2)
    
    # Create structuring prompt
    structuring_prompt = professional_experience.PROFESSIONAL_EXPERIENCE_STRUCTURING_PROMPT_TEMPLATE.format(
        planning_analysis=planning_analysis,
        criteria_json=criteria_json
    )
    
    # Get structured response
    structured_response = await structuring_model.ainvoke(
        [
            {"role": "system", "content": professional_experience.PROFESSIONAL_EXPERIENCE_STRUCTURING_SYSTEM_PROMPT},
            {"role": "user", "content": structuring_prompt}
        ]
    )
    
    # Log the structuring interaction
    state.conversation_log.append(f"PROFESSIONAL_EXPERIENCE_STRUCTURING_PROMPT: {structuring_prompt}")
    state.conversation_log.append(f"PROFESSIONAL_EXPERIENCE_STRUCTURING_RESPONSE: {structured_response}")
    
    # Extract scores from the Pydantic model
    work_experience_relevance = structured_response["work_experience_relevance"]
    career_progression = structured_response["career_progression"]
    leadership_experience = structured_response["leadership_experience"]
    achievements_impact = structured_response["achievements_impact"]
    industry_experience = structured_response["industry_experience"]
    overal_scores = (work_experience_relevance + career_progression + leadership_experience + achievements_impact + industry_experience) / 5
    
    return {
        "professional_experience_scores": {
            "scores": {
                "work_experience_relevance": work_experience_relevance,
                "career_progression": career_progression,
                "leadership_experience": leadership_experience,
                "achievements_impact": achievements_impact,
                "industry_experience": industry_experience,
                "overall_scores": overal_scores
            },
            "justification": structured_response["justification"],
            "professional_experience_analysis": planning_analysis
        }
    }


# Define the graph
def create_graph(config: Configuration) -> StateGraph:
    """Create the professional experience analyst agent graph."""
    builder = StateGraph(ProfessionalExperienceState)
    
    # Add nodes for two-step process
    builder.add_node("plan_analysis", plan_professional_experience_analysis)
    builder.add_node("structure_scores", structure_professional_experience_scores)
    
    # Define edges for two-step flow
    builder.add_edge(START, "plan_analysis")
    builder.add_edge("plan_analysis", "structure_scores")
    builder.add_edge("structure_scores", END)
    
    # Compile the graph
    return builder.compile()

# Create the graph instance with config-loaded configuration
graph = create_graph(configuration) 