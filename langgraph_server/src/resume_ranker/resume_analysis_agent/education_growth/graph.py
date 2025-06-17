"""Define the education and growth agent graph."""

import json
import logging
from typing import Dict, Any, List, cast

from langchain_core.messages import AIMessage
from langgraph.graph import StateGraph, START, END

from src.resume_ranker.configuration import Configuration
from src.resume_ranker.resume_analysis_agent.education_growth.state import EducationGrowthState
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

async def analyze_education_growth(state: EducationGrowthState) -> Dict[str, Any]:
    """Analyze the education and professional development in the resume.
    
    This node assesses degree relevance, certifications, continuous learning patterns,
    and professional development initiatives.
    """
    # Load model based on configuration
    education_model = load_chat_model(
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
    prompt = prompts.EDUCATION_GROWTH_PROMPT_TEMPLATE.format(
        resume_text=resume_text,
        criteria_json=criteria_json
    )
    
    # Get the model's response
    response = await education_model.ainvoke(
        [
            {"role": "system", "content": prompts.EDUCATION_GROWTH_SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ]
    )
    
    # Log the prompt and response for debugging
    state.conversation_log.append(f"EDUCATION_GROWTH_PROMPT: {prompt}")
    state.conversation_log.append(f"EDUCATION_GROWTH_RESPONSE: {json.dumps(response, indent=2)}")
    
    # Extract scores and justification
    scores = {}
    justification = response.get("justification", "")
    
    # Remove justification from the response to isolate scores
    if "justification" in response:
        response_copy = response.copy()
        del response_copy["justification"]
        scores = response_copy
    
    # Extract education, certifications, and continuous learning (simplified)
    # In a real implementation, you might use more sophisticated parsing or a structured output model
    education = {}
    certifications = []
    continuous_learning = {"evidence": [], "score": 0}
    
    # Simple parsing logic - in production would use structured output or better parsing
    for line in justification.split("\n"):
        line = line.strip()
        if "degree" in line.lower() or "education" in line.lower() and ":" in line:
            key, value = line.split(":", 1)
            education[key.strip()] = value.strip()
        elif "certification" in line.lower() or "certificate" in line.lower():
            if ":" in line:
                cert_name, details = line.split(":", 1)
                certifications.append({
                    "name": cert_name.strip(),
                    "details": details.strip()
                })
            else:
                certifications.append({
                    "name": line.strip(),
                    "details": ""
                })
        elif "learning" in line.lower() or "development" in line.lower() or "training" in line.lower():
            continuous_learning["evidence"].append(line)
    
    # Calculate a simple score for continuous learning
    continuous_learning["score"] = min(5, len(continuous_learning["evidence"]))
    
    # Return the updated state
    return {
        "education_growth_scores": {
            "scores": scores,
            "justification": justification
        },
        "education": education,
        "certifications": certifications,
        "continuous_learning": continuous_learning
    }

# Define the graph
def create_graph(config: Configuration) -> StateGraph:
    """Create the education and growth agent graph."""
    builder = StateGraph(EducationGrowthState)
    
    # Add nodes
    builder.add_node("analyze_education_growth", analyze_education_growth)
    
    # Define edges
    builder.add_edge(START, "analyze_education_growth")
    builder.add_edge("analyze_education_growth", END)
    
    # Compile the graph
    return builder.compile()

# Create the graph instance
graph = create_graph(Configuration()) 