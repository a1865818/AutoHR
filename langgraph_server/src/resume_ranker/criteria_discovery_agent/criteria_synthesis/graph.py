"""Define the criteria synthesis agent graph."""

import json
import logging
from typing import Dict, Any, List, cast

from langchain_core.messages import AIMessage
from langgraph.graph import StateGraph, START, END

from src.resume_ranker.configuration import Configuration
from src.resume_ranker.criteria_discovery_agent.criteria_synthesis.state import CriteriaSynthesisState, CriteriaSynthesisStructured
from src.resume_ranker.utils import load_chat_model, ConfigManager
from src.resume_ranker.criteria_discovery_agent.prompts import criteria_synthesis

logger = logging.getLogger(__file__.split("langgraph_server")[1])

# Load configuration
config_manager = ConfigManager("src/configs/gpt_4.1_nano.json")
configuration = Configuration.from_runnable_config(config_manager.get("resume_ranker"))

# Create model instance
criteria_synthesis_model = load_chat_model(configuration.model, configuration.provider, configuration.temperature, configuration.max_retries)

async def plan_criteria_strategy(state: CriteriaSynthesisState) -> Dict[str, Any]:
    """Plan and develop a comprehensive strategy for criteria synthesis.
    
    This node develops a strategic approach for creating evaluation criteria
    without the constraints of structured output.
    """
    # Use pre-configured model instance for planning phase
    
    # Create comprehensive planning and strategy prompt
    planning_prompt = criteria_synthesis.PLANNING_PROMPT_TEMPLATE.format(
        job_analysis=state.job_analysis,
        company_info=state.company_info or "No specific company information provided"
    )
    
    # Get the model's response
    response = cast(
        AIMessage,
        await criteria_synthesis_model.ainvoke(
            [
                {"role": "system", "content": criteria_synthesis.SYSTEM_PROMPT},
                {"role": "user", "content": planning_prompt}
            ]
        ),
    )
    
    # Extract response content
    strategy_content = response.content if hasattr(response, 'content') else str(response)
    
    # Log the planning interaction
    state.conversation_log.append(f"CRITERIA_SYNTHESIS_PLANNING_PROMPT: {planning_prompt}")
    state.conversation_log.append(f"CRITERIA_SYNTHESIS_PLANNING_RESPONSE: {strategy_content}")
    
    return {
        "planning_results": strategy_content,
        "messages": [response]
    }


async def structure_criteria_synthesis(state: CriteriaSynthesisState) -> Dict[str, Any]:
    """Convert comprehensive strategy into structured evaluation criteria.
    
    This node takes the planning results and generates structured criteria using Pydantic model.
    """
    # Create model with structured output using config
    structuring_model = load_chat_model(
        configuration.model, 
        configuration.provider, 
        configuration.temperature, 
        configuration.max_retries
    ).with_structured_output(CriteriaSynthesisStructured)
    
    # Get planning strategy
    planning_strategy = state.planning_results
    
    # Create structuring prompt
    structuring_prompt = criteria_synthesis.STRUCTURING_PROMPT_TEMPLATE.format(
        planning_analysis=planning_strategy
    )
    
    # Get structured response
    structured_response = await structuring_model.ainvoke(
        [
            {"role": "system", "content": criteria_synthesis.SYSTEM_PROMPT},
            {"role": "user", "content": structuring_prompt}
        ]
    )
    
    # Log the structuring interaction
    state.conversation_log.append(f"CRITERIA_SYNTHESIS_STRUCTURING_PROMPT: {structuring_prompt}")
    state.conversation_log.append(f"CRITERIA_SYNTHESIS_STRUCTURING_RESPONSE: {structured_response}")
    
    # Convert structured response to list format for compatibility
    raw_criteria = []
    validated_criteria = []
    
    # Handle empty evaluation_criteria
    evaluation_criteria = structured_response.evaluation_criteria or []
    
    for criterion in evaluation_criteria:
        criterion_dict = {
            "name": criterion.name,
            "description": criterion.description,
            "weight": criterion.weight,
        }
        raw_criteria.append(criterion_dict)
    
    # Validate and normalize the criteria
    validated_criteria = validate_criteria(raw_criteria)
    
    # Return the updated state with all structured information
    return {
        "criteria_summary": structured_response.criteria_summary,
        "validated_criteria": validated_criteria
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
    return validated

# Define the graph
def create_graph(config: Configuration) -> StateGraph:
    """Create the criteria synthesis agent graph with two-node architecture."""
    builder = StateGraph(CriteriaSynthesisState)
    
    # Add nodes with sync wrappers
    builder.add_node("plan_criteria_strategy", plan_criteria_strategy)
    builder.add_node("structure_criteria_synthesis", structure_criteria_synthesis)
    
    # Define edges - sequential flow from planning to structuring
    builder.add_edge(START, "plan_criteria_strategy")
    builder.add_edge("plan_criteria_strategy", "structure_criteria_synthesis")
    builder.add_edge("structure_criteria_synthesis", END)
    
    # Compile the graph
    return builder.compile()

# Create the graph instance with config-loaded configuration
graph = create_graph(configuration) 