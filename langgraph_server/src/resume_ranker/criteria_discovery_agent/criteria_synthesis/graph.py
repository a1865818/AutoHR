"""Define the criteria synthesis agent graph."""

import json
import logging
from typing import Dict, Any, List, cast

from langchain_core.messages import AIMessage
from langgraph.graph import StateGraph, START, END

from src.resume_ranker.configuration import Configuration
from src.resume_ranker.criteria_discovery_agent.criteria_synthesis.state import CriteriaSynthesisState
from src.resume_ranker.utils import load_chat_model
import src.resume_ranker.prompts as prompts

logger = logging.getLogger(__file__.split("langgraph_server")[1])

# JSON schema for structured output
criteria_schema = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "name": {"type": "string"},
            "description": {"type": "string"},
            "weight": {"type": "number"},
            "rubric": {
                "type": "object",
                "properties": {
                    "5": {"type": "string"},
                    "3": {"type": "string"},
                    "1": {"type": "string"}
                },
                "required": ["5", "3", "1"]
            }
        },
        "required": ["name", "description", "weight", "rubric"]
    }
}

async def generate_criteria(state: CriteriaSynthesisState) -> Dict[str, Any]:
    """Generate evaluation criteria based on job analysis and company information.
    
    This node creates a structured set of weighted evaluation criteria with scoring rubrics.
    """
    # Load model based on configuration
    criteria_model = load_chat_model(
        state.model, 
        state.provider, 
        state.criteria_synthesis_temperature, 
        state.max_retries
    ).with_structured_output(criteria_schema)
    
    # Format the prompt
    prompt = prompts.CRITERIA_SYNTHESIS_PROMPT_TEMPLATE.format(
        job_analysis=state.job_analysis.get("full_analysis", ""),
        company_info=state.company_info
    )
    
    # Get the model's response
    response = await criteria_model.ainvoke(
        [
            {"role": "system", "content": prompts.CRITERIA_SYNTHESIS_SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ]
    )
    
    # Log the prompt and response for debugging
    state.conversation_log.append(f"CRITERIA_SYNTHESIS_PROMPT: {prompt}")
    state.conversation_log.append(f"CRITERIA_SYNTHESIS_RESPONSE: {json.dumps(response, indent=2)}")
    
    # Validate the criteria
    validated_criteria = validate_criteria(response)
    
    # Return the updated state
    return {
        "raw_criteria": response,
        "validated_criteria": validated_criteria,
        "evaluation_criteria": validated_criteria
    }

def validate_criteria(criteria: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Validate and normalize the generated criteria.
    
    This function ensures that weights sum to 1.0 and that all required fields are present.
    """
    if not criteria:
        return []
    
    # Make a deep copy to avoid modifying the original
    validated = json.loads(json.dumps(criteria))
    
    # Calculate the sum of weights
    total_weight = sum(c.get("weight", 0) for c in validated)
    
    # Normalize weights if total is not close to 1.0
    if abs(total_weight - 1.0) > 0.01:
        for criterion in validated:
            criterion["weight"] = criterion.get("weight", 0) / total_weight
    
    # Ensure all required fields are present
    for criterion in validated:
        if "name" not in criterion:
            criterion["name"] = "Unnamed Criterion"
        if "description" not in criterion:
            criterion["description"] = f"Evaluation of {criterion['name']}"
        if "weight" not in criterion:
            criterion["weight"] = 1.0 / len(validated)
        if "rubric" not in criterion:
            criterion["rubric"] = {
                "5": "Exceptional match",
                "3": "Adequate match",
                "1": "Minimal/no match"
            }
        else:
            for score in ["5", "3", "1"]:
                if score not in criterion["rubric"]:
                    criterion["rubric"][score] = f"{score} points"
    
    return validated

# Define the graph
def create_graph(config: Configuration) -> StateGraph:
    """Create the criteria synthesis agent graph."""
    builder = StateGraph(CriteriaSynthesisState)
    
    # Add nodes
    builder.add_node("generate_criteria", generate_criteria)
    
    # Define edges
    builder.add_edge(START, "generate_criteria")
    builder.add_edge("generate_criteria", END)
    
    # Compile the graph
    return builder.compile()

# Create the graph instance
graph = create_graph(Configuration()) 