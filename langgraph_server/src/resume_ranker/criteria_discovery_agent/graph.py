"""Define the criteria discovery agent graph."""

import logging
from typing import Dict, Any

from langgraph.graph import StateGraph, START, END

from src.resume_ranker.configuration import Configuration
from src.resume_ranker.criteria_discovery_agent.state import CriteriaDiscoveryState
from src.resume_ranker.criteria_discovery_agent.configuration import CriteriaDiscoveryConfiguration
from src.resume_ranker.criteria_discovery_agent.job_intelligence.graph import graph as job_intelligence_graph
from src.resume_ranker.criteria_discovery_agent.criteria_synthesis.graph import graph as criteria_synthesis_graph

logger = logging.getLogger(__file__.split("langgraph_server")[1])

async def job_intelligence_node(state: CriteriaDiscoveryState) -> Dict[str, Any]:
    """Run the job intelligence agent to analyze the job description.
    
    This node delegates to the job intelligence graph to extract requirements and priorities.
    """
    # Create a copy of the state to pass to the job intelligence graph
    subgraph_state = {
        "job_description": state.job_description,
        "company_info": state.company_info,
        "conversation_log": state.conversation_log
    }
    
    # Run the job intelligence graph
    result = await job_intelligence_graph.ainvoke(subgraph_state)
    
    # Extract the relevant information from the result
    return {
        "job_analysis": result.get("job_analysis", ""),
        "messages": result.get("messages", [])
    }

async def criteria_synthesis_node(state: CriteriaDiscoveryState) -> Dict[str, Any]:
    """Run the criteria synthesis agent to generate evaluation criteria.
    
    This node delegates to the criteria synthesis graph to create weighted evaluation criteria.
    """
    # Create a copy of the state to pass to the criteria synthesis graph
    subgraph_state = {
        "job_description": state.job_description,
        "company_info": state.company_info,
        "job_analysis": state.job_analysis,
        "messages": state.messages

    }
    
    # Run the criteria synthesis graph
    result = await criteria_synthesis_graph.ainvoke(subgraph_state)
    
    # Extract the relevant information from the result
    return {
        "validated_criteria": result.get("validated_criteria", []),
        "messages": result.get("messages", [])
    }

# Define the graph
def create_graph(config: CriteriaDiscoveryConfiguration) -> StateGraph:
    """Create the criteria discovery agent graph."""
    builder = StateGraph(CriteriaDiscoveryState)
    
    # Add nodes
    builder.add_node("job_intelligence", job_intelligence_node)
    builder.add_node("criteria_synthesis", criteria_synthesis_node)
    
    # Define edges
    builder.add_edge(START, "job_intelligence")
    builder.add_edge("job_intelligence", "criteria_synthesis")
    builder.add_edge("criteria_synthesis", END)
    
    # Compile the graph
    return builder.compile()

# Create the graph instance with default configuration
graph = create_graph(CriteriaDiscoveryConfiguration()) 
graph.name = "criteria_discovery_graph"