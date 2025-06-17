"""Define the skills assessment agent graph."""

import json
import logging
from typing import Dict, Any, cast

from langchain_core.messages import AIMessage
from langgraph.graph import StateGraph, START, END

from src.resume_ranker.configuration import Configuration
from src.resume_ranker.resume_analysis_agent.skills_assessment.state import SkillsAssessmentState
from src.resume_ranker.utils import load_chat_model
import src.resume_ranker.prompts as prompts

logger = logging.getLogger(__file__.split("langgraph_server")[1])

# JSON schema for structured output
score_schema = {
    "type": "object",
    "additionalProperties": {
        "type": "number",
        "minimum": 1,
        "maximum": 5
    },
    "properties": {
        "justification": {"type": "string"}
    },
    "required": ["justification"]
}

async def analyze_skills(state: SkillsAssessmentState) -> Dict[str, Any]:
    """Analyze the technical and soft skills in the resume.
    
    This node identifies skills, assesses proficiency levels, evaluates skill currency and relevance,
    and matches skills against job requirements.
    """
    # Load model based on configuration
    skills_model = load_chat_model(
        state.model, 
        state.provider, 
        state.scoring_temperature, 
        state.max_retries
    ).with_structured_output(score_schema)
    
    # Get the resume text
    resume_text = state.current_resume.get("content", "")
    
    # Convert criteria to JSON for the prompt
    criteria_json = json.dumps(state.evaluation_criteria, indent=2)
    
    # Format the prompt
    prompt = prompts.SKILLS_ASSESSMENT_PROMPT_TEMPLATE.format(
        resume_text=resume_text,
        criteria_json=criteria_json
    )
    
    # Get the model's response
    response = await skills_model.ainvoke(
        [
            {"role": "system", "content": prompts.SKILLS_ASSESSMENT_SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ]
    )
    
    # Log the prompt and response for debugging
    state.conversation_log.append(f"SKILLS_ASSESSMENT_PROMPT: {prompt}")
    state.conversation_log.append(f"SKILLS_ASSESSMENT_RESPONSE: {json.dumps(response, indent=2)}")
    
    # Extract scores and justification
    scores = {}
    justification = response.get("justification", "")
    
    # Remove justification from the response to isolate scores
    if "justification" in response:
        response_copy = response.copy()
        del response_copy["justification"]
        scores = response_copy
    
    # Extract technical and soft skills (simplified)
    # In a real implementation, you might use more sophisticated parsing or a structured output model
    technical_skills = {}
    soft_skills = {}
    skills_relevance = {}
    
    # Simple parsing logic - in production would use structured output or better parsing
    for line in justification.split("\n"):
        line = line.strip()
        if "technical skill" in line.lower() and ":" in line:
            skill, detail = line.split(":", 1)
            technical_skills[skill.strip()] = detail.strip()
        elif "soft skill" in line.lower() and ":" in line:
            skill, detail = line.split(":", 1)
            soft_skills[skill.strip()] = detail.strip()
    
    # Calculate relevance scores
    for skill in technical_skills:
        skills_relevance[skill] = 1.0  # Default high relevance
    
    for skill in soft_skills:
        skills_relevance[skill] = 1.0  # Default high relevance
    
    # Return the updated state
    return {
        "skills_assessment_scores": {
            "scores": scores,
            "justification": justification
        },
        "technical_skills": technical_skills,
        "soft_skills": soft_skills,
        "skills_relevance": skills_relevance
    }

# Define the graph
def create_graph(config: Configuration) -> StateGraph:
    """Create the skills assessment agent graph."""
    builder = StateGraph(SkillsAssessmentState)
    
    # Add nodes
    builder.add_node("analyze_skills", analyze_skills)
    
    # Define edges
    builder.add_edge(START, "analyze_skills")
    builder.add_edge("analyze_skills", END)
    
    # Compile the graph
    return builder.compile()

# Create the graph instance
graph = create_graph(Configuration()) 