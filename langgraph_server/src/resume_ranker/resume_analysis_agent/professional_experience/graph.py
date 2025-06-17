"""Define the professional experience analyst agent graph."""

import json
import logging
from typing import Dict, Any, cast

from langchain_core.messages import AIMessage
from langgraph.graph import StateGraph, START, END

from src.resume_ranker.configuration import Configuration
from src.resume_ranker.resume_analysis_agent.professional_experience.state import ProfessionalExperienceState
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

async def analyze_professional_experience(state: ProfessionalExperienceState) -> Dict[str, Any]:
    """Analyze the professional experience in the resume.
    
    This node evaluates the candidate's work history, career progression, role relevance,
    leadership growth, and achievements against the evaluation criteria.
    """
    # Load model based on configuration
    experience_model = load_chat_model(
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
    prompt = prompts.PROFESSIONAL_EXPERIENCE_PROMPT_TEMPLATE.format(
        resume_text=resume_text,
        criteria_json=criteria_json
    )
    
    # Get the model's response
    response = await experience_model.ainvoke(
        [
            {"role": "system", "content": prompts.PROFESSIONAL_EXPERIENCE_SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ]
    )
    
    # Log the prompt and response for debugging
    state.conversation_log.append(f"PROFESSIONAL_EXPERIENCE_PROMPT: {prompt}")
    state.conversation_log.append(f"PROFESSIONAL_EXPERIENCE_RESPONSE: {json.dumps(response, indent=2)}")
    
    # Extract scores and justification
    scores = {}
    justification = response.get("justification", "")
    
    # Remove justification from the response to isolate scores
    if "justification" in response:
        response_copy = response.copy()
        del response_copy["justification"]
        scores = response_copy
    
    # Analyze career progression and role relevance (simplified)
    career_progression = {
        "analysis": "Career progression analysis would be extracted from the LLM response",
        "score": sum(scores.values()) / len(scores) if scores else 0
    }
    
    role_relevance = {
        "analysis": "Role relevance analysis would be extracted from the LLM response",
        "score": sum(scores.values()) / len(scores) if scores else 0
    }
    
    # Return the updated state
    return {
        "professional_experience_scores": {
            "scores": scores,
            "justification": justification
        },
        "career_progression": career_progression,
        "role_relevance": role_relevance
    }

# Define the graph
def create_graph(config: Configuration) -> StateGraph:
    """Create the professional experience analyst agent graph."""
    builder = StateGraph(ProfessionalExperienceState)
    
    # Add nodes
    builder.add_node("analyze_professional_experience", analyze_professional_experience)
    
    # Define edges
    builder.add_edge(START, "analyze_professional_experience")
    builder.add_edge("analyze_professional_experience", END)
    
    # Compile the graph
    return builder.compile()

# Create the graph instance
graph = create_graph(Configuration()) 