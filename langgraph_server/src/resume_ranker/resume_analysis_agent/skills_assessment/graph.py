"""Define the skills assessment agent graph."""

import json
import logging
from typing import Dict, Any, cast

from langchain_core.messages import AIMessage
from langgraph.graph import StateGraph, START, END

from src.resume_ranker.configuration import Configuration
from src.resume_ranker.resume_analysis_agent.skills_assessment.state import (
    SkillsAssessmentState,
    SkillsAssessmentPlanning, 
    SkillsAssessmentScores
)
from src.resume_ranker.utils import load_chat_model, ConfigManager
from src.resume_ranker.resume_analysis_agent.prompts import skills_assessment

logger = logging.getLogger(__file__.split("langgraph_server")[1])

# Load configuration
config_manager = ConfigManager("src/configs/gpt_4.1_nano.json")
configuration = Configuration.from_runnable_config(config_manager.get("resume_ranker"))

async def plan_skills_assessment_analysis(state: SkillsAssessmentState) -> Dict[str, Any]:
    """Plan and analyze skills using a normal chat model.
    
    This node performs comprehensive skills analysis and planning without structured output constraints.
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

    # Inject the resume text and criteria into the template (previously the raw, unformatted
    # template was sent, so the model saw the literal {resume_text}/{criteria_json} placeholders
    # and reported the resume content as missing).
    planning_prompt = skills_assessment.SKILLS_ASSESSMENT_PROMPT_TEMPLATE.format(
        resume_text=resume_text,
        criteria_json=criteria_json
    )

    # Get the model's response
    response = await planning_model.ainvoke(
        [
            {"role": "system", "content": skills_assessment.SKILLS_ASSESSMENT_PLANNING_SYSTEM_PROMPT},
            {"role": "user", "content": planning_prompt}
        ]
    )
    
    # Extract response content
    analysis_content = response.content if hasattr(response, 'content') else str(response)
    
    # Create planning results
    planning_results = {
        "analysis": analysis_content
    }
    
    return {
        "planning_results": planning_results
    }


async def structure_skills_assessment_scores(state: SkillsAssessmentState) -> Dict[str, Any]:
    """Convert planning analysis into structured scores using Pydantic model.
    
    This node takes the planning results and generates structured scores.
    """
    # Use config-loaded model with structured output
    structuring_model = load_chat_model(
        configuration.model, 
        configuration.provider, 
        configuration.scoring_temperature, 
        configuration.max_retries
    ).with_structured_output(SkillsAssessmentScores)
    
    # Get planning results
    planning_analysis = state.planning_results.get("analysis", "No planning analysis available")
    
    # Convert criteria to JSON for reference
    criteria_json = json.dumps(state.evaluation_criteria, indent=2)
    
    # Create structuring prompt
    structuring_prompt = skills_assessment.SKILLS_ASSESSMENT_STRUCTURING_PROMPT_TEMPLATE.format(
        planning_analysis=planning_analysis,
        criteria_json=criteria_json
    )
    
    # Get structured response
    structured_response = await structuring_model.ainvoke(
        [
            {"role": "system", "content": skills_assessment.SKILLS_ASSESSMENT_STRUCTURING_SYSTEM_PROMPT},
            {"role": "user", "content": structuring_prompt}
        ]
    )
    
    # Log the structuring interaction
    state.conversation_log.append(f"SKILLS_ASSESSMENT_STRUCTURING_PROMPT: {structuring_prompt}")
    state.conversation_log.append(f"SKILLS_ASSESSMENT_STRUCTURING_RESPONSE: {structured_response}")
    
    # Extract scores from the Pydantic model
    technical_skills = structured_response["technical_skills_match"]
    soft_skills = structured_response["soft_skills_demonstration"]
    proficiency_level = structured_response["skill_proficiency_level"]
    learning_adaptability = structured_response["learning_adaptability"]


    overal_scores = (technical_skills + soft_skills + proficiency_level + learning_adaptability) / 4
    
    return {
        "skills_assessment_scores": {
            "scores": {
                "technical_skills": technical_skills,
                "soft_skills": soft_skills,
                "proficiency_level": proficiency_level,
                "learning_adaptability": learning_adaptability,
                "overall_scores": overal_scores
            }, 
            "justification": structured_response["justification"],
            "skills_assessment_analysis": planning_analysis
        },
    }

# Define the graph
def create_graph(config: Configuration) -> StateGraph:
    """Create the skills assessment agent graph."""
    builder = StateGraph(SkillsAssessmentState)
    
    # Add nodes for two-step process
    builder.add_node("plan_analysis", plan_skills_assessment_analysis)
    builder.add_node("structure_scores", structure_skills_assessment_scores)
    
    # Define edges for two-step flow
    builder.add_edge(START, "plan_analysis")
    builder.add_edge("plan_analysis", "structure_scores")
    builder.add_edge("structure_scores", END)
    
    # Compile the graph
    return builder.compile()

# Create the graph instance with config-loaded configuration
graph = create_graph(configuration) 