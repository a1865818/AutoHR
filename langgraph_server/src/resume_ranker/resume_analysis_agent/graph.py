"""Define the resume analysis agent graph."""

import json
import logging
from typing import Dict, Any, List, cast

from langchain_core.messages import AIMessage
from langgraph.graph import StateGraph, START, END

from src.resume_ranker.configuration import Configuration
from src.resume_ranker.resume_analysis_agent.state import ResumeAnalysisState
from src.resume_ranker.resume_analysis_agent.configuration import ResumeAnalysisConfiguration
from src.resume_ranker.resume_analysis_agent.professional_experience.graph import graph as professional_experience_graph
from src.resume_ranker.resume_analysis_agent.skills_assessment.graph import graph as skills_assessment_graph
from src.resume_ranker.resume_analysis_agent.education_growth.graph import graph as education_growth_graph
from src.resume_ranker.resume_analysis_agent.cultural_fit.graph import graph as cultural_fit_graph
from src.resume_ranker.utils import load_chat_model, weighted_scoring
import src.resume_ranker.prompts as prompts

logger = logging.getLogger(__file__.split("langgraph_server")[1])

def professional_experience_node(state: ResumeAnalysisState) -> Dict[str, Any]:
    """Run the professional experience analyst agent.
    
    This node delegates to the professional experience graph to analyze work history and achievements.
    """
    # Create a copy of the state to pass to the professional experience graph
    subgraph_state = {
        "current_resume": state.current_resume,
        "job_description": state.job_description,
        "evaluation_criteria": state.evaluation_criteria,
        "model": state.model,
        "provider": state.provider,
        "scoring_temperature": state.scoring_temperature,
        "max_retries": state.max_retries,
        "conversation_log": state.conversation_log
    }
    
    # Run the professional experience graph
    result = professional_experience_graph.invoke(subgraph_state)
    
    # Extract the relevant information from the result
    return {
        "professional_experience_scores": result.get("professional_experience_scores", {}),
        "conversation_log": result.get("conversation_log", state.conversation_log)
    }

def skills_assessment_node(state: ResumeAnalysisState) -> Dict[str, Any]:
    """Run the skills assessment analyst agent.
    
    This node delegates to the skills assessment graph to analyze technical and soft skills.
    """
    # Create a copy of the state to pass to the skills assessment graph
    subgraph_state = {
        "current_resume": state.current_resume,
        "job_description": state.job_description,
        "evaluation_criteria": state.evaluation_criteria,
        "model": state.model,
        "provider": state.provider,
        "scoring_temperature": state.scoring_temperature,
        "max_retries": state.max_retries,
        "conversation_log": state.conversation_log
    }
    
    # Run the skills assessment graph
    result = skills_assessment_graph.invoke(subgraph_state)
    
    # Extract the relevant information from the result
    return {
        "skills_assessment_scores": result.get("skills_assessment_scores", {}),
        "conversation_log": result.get("conversation_log", state.conversation_log)
    }

def education_growth_node(state: ResumeAnalysisState) -> Dict[str, Any]:
    """Run the education and growth analyst agent.
    
    This node delegates to the education and growth graph to analyze education and professional development.
    """
    # Create a copy of the state to pass to the education and growth graph
    subgraph_state = {
        "current_resume": state.current_resume,
        "job_description": state.job_description,
        "evaluation_criteria": state.evaluation_criteria,
        "model": state.model,
        "provider": state.provider,
        "scoring_temperature": state.scoring_temperature,
        "max_retries": state.max_retries,
        "conversation_log": state.conversation_log
    }
    
    # Run the education and growth graph
    result = education_growth_graph.invoke(subgraph_state)
    
    # Extract the relevant information from the result
    return {
        "education_growth_scores": result.get("education_growth_scores", {}),
        "conversation_log": result.get("conversation_log", state.conversation_log)
    }

def cultural_fit_node(state: ResumeAnalysisState) -> Dict[str, Any]:
    """Run the cultural fit analyst agent.
    
    This node delegates to the cultural fit graph to analyze alignment with company culture.
    """
    # Create a copy of the state to pass to the cultural fit graph
    subgraph_state = {
        "current_resume": state.current_resume,
        "job_description": state.job_description,
        "company_info": state.company_info,
        "evaluation_criteria": state.evaluation_criteria,
        "model": state.model,
        "provider": state.provider,
        "scoring_temperature": state.scoring_temperature,
        "max_retries": state.max_retries,
        "conversation_log": state.conversation_log
    }
    
    # Run the cultural fit graph
    result = cultural_fit_graph.invoke(subgraph_state)
    
    # Extract the relevant information from the result
    return {
        "cultural_fit_scores": result.get("cultural_fit_scores", {}),
        "conversation_log": result.get("conversation_log", state.conversation_log)
    }

def aggregate_scores_node(state: ResumeAnalysisState) -> Dict[str, Any]:
    """Aggregate scores from all analysts into a final score for the resume.
    
    This node combines the scores from each analyst, applies weights, and generates a final score.
    """
    # Extract scores from each analyst
    professional_scores = state.professional_experience_scores.get("scores", {})
    skills_scores = state.skills_assessment_scores.get("scores", {})
    education_scores = state.education_growth_scores.get("scores", {})
    cultural_scores = state.cultural_fit_scores.get("scores", {})
    
    # Combine all scores
    all_scores = {}
    all_scores.update(professional_scores)
    all_scores.update(skills_scores)
    all_scores.update(education_scores)
    all_scores.update(cultural_scores)
    
    # Calculate weighted score using the evaluation criteria
    weighted_score = weighted_scoring(state.evaluation_criteria, all_scores)
    
    # Create aggregate score object with justifications
    aggregate_scores = {
        "resume_id": state.current_resume.get("id", "unknown"),
        "filename": state.current_resume.get("filename", "unknown"),
        "total_score": weighted_score,
        "scores_by_criterion": all_scores,
        "justifications": {
            "professional_experience": state.professional_experience_scores.get("justification", ""),
            "skills_assessment": state.skills_assessment_scores.get("justification", ""),
            "education_growth": state.education_growth_scores.get("justification", ""),
            "cultural_fit": state.cultural_fit_scores.get("justification", "")
        }
    }
    
    # Return the updated state
    return {
        "aggregate_scores": aggregate_scores
    }

# Define the graph
def create_graph(config: ResumeAnalysisConfiguration) -> StateGraph:
    """Create the resume analysis agent graph."""
    builder = StateGraph(ResumeAnalysisState)
    
    # Add nodes
    builder.add_node("professional_experience", professional_experience_node)
    builder.add_node("skills_assessment", skills_assessment_node)
    builder.add_node("education_growth", education_growth_node)
    builder.add_node("cultural_fit", cultural_fit_node)
    builder.add_node("aggregate_scores_node", aggregate_scores_node)
    
    # Define edges based on configuration
    if config.parallel_analysis:
        # Parallel execution of analysis nodes
        builder.add_edge(START, "professional_experience")
        builder.add_edge(START, "skills_assessment")
        builder.add_edge(START, "education_growth")
        builder.add_edge(START, "cultural_fit")
        
        builder.add_edge("professional_experience", "aggregate_scores_node")
        builder.add_edge("skills_assessment", "aggregate_scores_node")
        builder.add_edge("education_growth", "aggregate_scores_node")
        builder.add_edge("cultural_fit", "aggregate_scores_node")
    else:
        # Sequential execution of analysis nodes
        builder.add_edge(START, "professional_experience")
        builder.add_edge("professional_experience", "skills_assessment")
        builder.add_edge("skills_assessment", "education_growth")
        builder.add_edge("education_growth", "cultural_fit")
        builder.add_edge("cultural_fit", "aggregate_scores_node")
    
    builder.add_edge("aggregate_scores_node", END)
    
    # Compile the graph
    return builder.compile()

# Create the graph instance with default configuration
graph = create_graph(ResumeAnalysisConfiguration()) 