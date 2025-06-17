"""Define the cultural fit agent graph."""

import json
import logging
from typing import Dict, Any, List, cast

from langchain_core.messages import AIMessage
from langgraph.graph import StateGraph, START, END

from src.resume_ranker.configuration import Configuration
from src.resume_ranker.resume_analysis_agent.cultural_fit.state import CulturalFitState
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

async def analyze_cultural_fit(state: CulturalFitState) -> Dict[str, Any]:
    """Analyze the cultural fit indicators in the resume.
    
    This node evaluates communication style, value alignment, collaboration evidence,
    innovation markers, and overall fit with company culture.
    """
    # Load model based on configuration
    cultural_model = load_chat_model(
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
    prompt = prompts.CULTURAL_FIT_PROMPT_TEMPLATE.format(
        resume_text=resume_text,
        company_info=state.company_info,
        criteria_json=criteria_json
    )
    
    # Get the model's response
    response = await cultural_model.ainvoke(
        [
            {"role": "system", "content": prompts.CULTURAL_FIT_SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ]
    )
    
    # Log the prompt and response for debugging
    state.conversation_log.append(f"CULTURAL_FIT_PROMPT: {prompt}")
    state.conversation_log.append(f"CULTURAL_FIT_RESPONSE: {json.dumps(response, indent=2)}")
    
    # Extract scores and justification
    scores = {}
    justification = response.get("justification", "")
    
    # Remove justification from the response to isolate scores
    if "justification" in response:
        response_copy = response.copy()
        del response_copy["justification"]
        scores = response_copy
    
    # Extract cultural fit indicators (simplified)
    # In a real implementation, you might use more sophisticated parsing or a structured output model
    communication_style = {"style": "", "score": 0}
    value_alignment = {"aligned_values": [], "misaligned_values": [], "score": 0}
    collaboration_evidence = []
    innovation_markers = []
    
    # Simple parsing logic - in production would use structured output or better parsing
    for line in justification.split("\n"):
        line = line.strip()
        if "communication" in line.lower() or "language" in line.lower():
            communication_style["style"] = line
            # Extract a score if present
            if "score" in line.lower() and ":" in line:
                try:
                    score_text = line.split("score", 1)[1].split(":", 1)[1].strip()
                    communication_style["score"] = int(score_text[0])
                except (IndexError, ValueError):
                    pass
        elif "value" in line.lower() or "alignment" in line.lower():
            if "aligned" in line.lower():
                value_alignment["aligned_values"].append(line)
            elif "misaligned" in line.lower():
                value_alignment["misaligned_values"].append(line)
        elif "team" in line.lower() or "collaborat" in line.lower():
            collaboration_evidence.append(line)
        elif "innovat" in line.lower() or "creativ" in line.lower() or "initiat" in line.lower():
            innovation_markers.append(line)
    
    # Calculate simple scores
    value_alignment["score"] = len(value_alignment["aligned_values"]) - len(value_alignment["misaligned_values"])
    value_alignment["score"] = max(1, min(5, value_alignment["score"] + 3))  # Scale to 1-5
    
    # Return the updated state
    return {
        "cultural_fit_scores": {
            "scores": scores,
            "justification": justification
        },
        "communication_style": communication_style,
        "value_alignment": value_alignment,
        "collaboration_evidence": collaboration_evidence,
        "innovation_markers": innovation_markers
    }

# Define the graph
def create_graph(config: Configuration) -> StateGraph:
    """Create the cultural fit agent graph."""
    builder = StateGraph(CulturalFitState)
    
    # Add nodes
    builder.add_node("analyze_cultural_fit", analyze_cultural_fit)
    
    # Define edges
    builder.add_edge(START, "analyze_cultural_fit")
    builder.add_edge("analyze_cultural_fit", END)
    
    # Compile the graph
    return builder.compile()

# Create the graph instance
graph = create_graph(Configuration()) 