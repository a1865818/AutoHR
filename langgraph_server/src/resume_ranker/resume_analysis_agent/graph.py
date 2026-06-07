"""Define the resume analysis agent graph using Send map-reduce pattern."""

import logging
from typing import Dict, Any, Literal

from langgraph.graph import StateGraph
from langgraph.types import Send, Command
from src.resume_ranker.resume_analysis_agent.state import ResumeAnalysisState, AnalystTask

# Import analyst subgraphs
from src.resume_ranker.resume_analysis_agent.professional_experience.graph import graph as professional_experience_graph
from src.resume_ranker.resume_analysis_agent.skills_assessment.graph import graph as skills_assessment_graph
from src.resume_ranker.resume_analysis_agent.education_growth.graph import graph as education_growth_graph
from src.resume_ranker.resume_analysis_agent.cultural_fit.graph import graph as cultural_fit_graph

logger = logging.getLogger(__file__.split("langgraph_server")[1])



def parallelizing_node(state: ResumeAnalysisState) -> Command[Literal["analyst_node"]]:
    """
    Starting node that creates parallel Send tasks for each analyst type.
    
    This node implements the map phase of map-reduce by distributing
    analyst tasks using Send operations.
    
    Returns a list of Send objects for LangGraph to process.
    """
    logger.info("🚀 Starting parallel analysis dispatch")
    
    # Define the analyst types to process
    analyst_types = [
        "professional_experience", 
        "skills_assessment", 
        "education_growth", 
        "cultural_fit"
    ]
    
    # Create Send tasks for each analyst
    tasks = []
    for analyst_type in analyst_types:
        # Filter criteria relevant to this analyst
        relevant_criteria = state.evaluation_criteria
        
        task = Send(
            "analyst_node",
            {
                "analyst_type": analyst_type,
                "current_resume": state.current_resume,
                "criteria": relevant_criteria,
                "company_info": state.company_info
            }
        )
        tasks.append(task)
    
    logger.info(f"📤 Dispatching {len(tasks)} parallel analyst tasks")
    return Command(goto=tasks)


async def analyst_node(task_state: AnalystTask) -> Dict[str, Any]:
    """
    Generic analyst node that calls appropriate subgraphs for analysis.
    
    This node receives individual tasks via Send and delegates
    to specialized analyst subgraphs based on the analyst_type.
    """
    analyst_type = task_state["analyst_type"]
    current_resume = task_state["current_resume"]
    criteria = task_state.get("criteria", [])
    company_info = task_state.get("company_info", "")
    
    logger.info(f"🔬 Processing {analyst_type} analysis via subgraph")
    
    # Map analyst types to their corresponding subgraphs
    subgraph_map = {
        "professional_experience": professional_experience_graph,
        "skills_assessment": skills_assessment_graph,
        "education_growth": education_growth_graph,
        "cultural_fit": cultural_fit_graph
    }
    
    if analyst_type not in subgraph_map:
        raise ValueError(f"Unknown analyst type: {analyst_type}")
    
    subgraph = subgraph_map[analyst_type]
    
    subgraph_input = {
        "current_resume": current_resume,
        "evaluation_criteria": criteria,
        "company_info": company_info,
        "conversation_log": []
    }
    
    # Invoke the analyst subgraph
    logger.info(f"📞 Calling {analyst_type} subgraph")
    subgraph_result = await subgraph.ainvoke(subgraph_input)
    
    # Extract results from subgraph output
    # Each subgraph should return its specific scores and analysis
    scores = {}
    feedback = ""
    recommendations = []
    detailed_analysis = ""
    
    # Extract analyst-specific results based on type
    if analyst_type == "professional_experience":
        scores_data = subgraph_result.get("professional_experience_scores", {})
        scores = scores_data.get("scores", {})
        feedback = scores_data.get("justification", "")
        detailed_analysis = subgraph_result.get("planning_results", {}).get("analysis", "")
        
    elif analyst_type == "skills_assessment":
        scores_data = subgraph_result.get("skills_assessment_scores", {})
        scores = scores_data.get("scores", {})
        feedback = scores_data.get("justification", "")
        detailed_analysis = subgraph_result.get("planning_results", {}).get("analysis", "")
        
    elif analyst_type == "education_growth":
        scores_data = subgraph_result.get("education_growth_scores", {})
        scores = scores_data.get("scores", {})
        feedback = scores_data.get("justification", "")
        detailed_analysis = subgraph_result.get("planning_results", {}).get("analysis", "")
        
    elif analyst_type == "cultural_fit":
        scores_data = subgraph_result.get("cultural_fit_scores", {})
        scores = scores_data.get("scores", {})
        feedback = scores_data.get("justification", "")
        detailed_analysis = subgraph_result.get("planning_results", {}).get("analysis", "")
    
    # Return results in format that will be aggregated by the reducer
    result = {
        "analyst_type": analyst_type,
        "scores": scores,
        "feedback": feedback,
        "recommendations": recommendations,
        "detailed_analysis": detailed_analysis,
        "subgraph_output": subgraph_result  # Include full subgraph output for debugging
    }
    
    logger.info(f"✅ Completed {analyst_type} subgraph analysis")
    return {"analyst_results": [result]}

def aggregate_scores_node(state: ResumeAnalysisState) -> Dict[str, Any]:
    """
    Final aggregation node that combines all analyst results.
    
    This node implements the reduce phase of map-reduce by
    aggregating all parallel analyst results into final scores.
    """
    logger.info("🔄 Starting final score aggregation")
    
    if not state.analyst_results:
        logger.warning("⚠️ No analyst results found for aggregation")
        return {
            "final_score": 0.0,
            "detailed_feedback": "No analysis results available",
            "score_breakdown": {},
            "recommendations": []
        }
    
    logger.info(f"📊 Aggregating results from {len(state.analyst_results)} analysts")
    
    # Initialize aggregation variables
    total_score = 0.0
    analyst_count = 0
    all_recommendations = []
    feedback_sections = []
    score_breakdown = {}
    
    # Process each analyst result
    for result in state.analyst_results:
        analyst_type = result.get("analyst_type", "unknown")
        scores = result.get("scores", {})
        feedback = result.get("feedback", "")
        recommendations = result.get("recommendations", [])
        
        # Skip error results in scoring but include them in feedback
        if result.get("error", False):
            feedback_sections.append(f"**{analyst_type.replace('_', ' ').title()}**: {feedback}")
            continue
        
        # Calculate analyst score (assuming scores is a dict with numeric values)
        analyst_score = 0.0
        if scores:
            score_values = [v for v in scores.values() if isinstance(v, (int, float))]
            if score_values:
                analyst_score = sum(score_values) / len(score_values)
        
        # Add to totals
        total_score += analyst_score
        analyst_count += 1
        all_recommendations.extend(recommendations)
        
        # Store individual analyst breakdown
        score_breakdown[analyst_type] = {
            "score": analyst_score,
            "details": scores
        }
        
        # Add feedback section
        if feedback:
            feedback_sections.append(f"**{analyst_type.replace('_', ' ').title()}**: {feedback}")
    
    # Calculate final score
    final_score = total_score / analyst_count if analyst_count > 0 else 0.0
    # Normalize the score to a 0-100 scale
    final_score = (final_score / 5) * 100
    
    # Combine feedback
    detailed_feedback = "\n\n".join(feedback_sections) if feedback_sections else "No detailed feedback available"
    
    # Remove duplicate recommendations
    unique_recommendations = list(set(all_recommendations))
    
    # Also populate individual score fields for backward compatibility
    individual_scores = {}
    for result in state.analyst_results:
        analyst_type = result.get("analyst_type")
        if analyst_type and not result.get("error", False):
            field_name = f"{analyst_type}_scores"
            individual_scores[field_name] = {
                "scores": result.get("scores", {}),
                "feedback": result.get("feedback", ""),
                "recommendations": result.get("recommendations", [])
            }
    
    logger.info(f"✅ Final aggregation complete. Score: {final_score:.2f}")
    
    result = {
        "final_score": final_score,
        "detailed_feedback": detailed_feedback,
        "score_breakdown": score_breakdown,
        "recommendations": unique_recommendations,
        **individual_scores
    }
    
    return result


# Removed _parse_analysis_response as we now use subgraphs directly


# Define the graph
def create_graph() -> StateGraph:
    """Create the resume analysis agent graph with Send map-reduce architecture."""
    builder = StateGraph(ResumeAnalysisState)
    
    # Add nodes
    builder.add_node("parallelizing_node", parallelizing_node)
    builder.add_node("analyst_node", analyst_node)  # Single generic analyst node
    builder.add_node("aggregate_scores_node", aggregate_scores_node)
    
    # Define the flow using Send map-reduce pattern
    builder.set_entry_point("parallelizing_node")
    builder.set_finish_point("aggregate_scores_node")
    
    # After all analyst_node instances complete, go to aggregation
    builder.add_edge("analyst_node", "aggregate_scores_node")

    
    # Compile the graph
    return builder.compile()

# Create the graph instance with config-loaded configuration
graph = create_graph() 