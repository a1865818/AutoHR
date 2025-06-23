"""Define the master orchestrator graph for resume ranking."""

import logging
import copy
from typing import Literal

from langchain_core.messages import AIMessage
from langgraph.graph import StateGraph
from langgraph.types import Send, Command

from src.resume_ranker.configuration import Configuration
from src.resume_ranker.state import ResumeRankerState, InputState, OutputState
from src.resume_ranker.criteria_discovery_agent.graph import graph as criteria_discovery_graph
from src.resume_ranker.resume_analysis_agent.graph import graph as resume_analysis_graph
from src.resume_ranker.utils import (
    load_chat_model, 
    ConfigManager, 
    load_resume_from_supabase, 
    cleanup_temp_files
)

logger = logging.getLogger(__file__.split("langgraph_server")[1])

# Load configuration
config_manager = ConfigManager("src/configs/gpt_4.1_nano.json")
configuration = Configuration.from_runnable_config(config_manager.get("resume_ranker"))

# Create model instances
base_model = load_chat_model(configuration.model, configuration.provider, configuration.temperature, configuration.max_retries)
orchestrator_model = base_model.bind(stop=None)
final_ranking_model = base_model.bind(temperature=configuration.scoring_temperature)

def parse_input(state: ResumeRankerState) -> Command[Literal["criteria_discovery"]]:
    """Parse the input to extract job description, company information, and resumes.
    
    This node processes the initial input to prepare for the resume ranking workflow.
    """
    # Extract data from the InputState
    job_description = state.job_description
    company_info = state.company_info
    resume_bucket_name = state.resume_bucket_name
    resume_file_names = state.resume_file_names
    
    # Validate required inputs
    if not job_description:
        raise ValueError("Job description is required")
    
    if not resume_bucket_name:
        raise ValueError("Resume bucket name is required")
        
    if not resume_file_names:
        raise ValueError("At least one resume file name is required")
    
    # Download and load resumes from Supabase
    resumes = []
    failed_downloads = []
    
    for file_name in resume_file_names:
        try:
            resume = load_resume_from_supabase(resume_bucket_name, file_name)
            resumes.append(resume)
            logger.info(f"Successfully loaded resume: {file_name}")
        except Exception as e:
            logger.error(f"Error loading resume {file_name}: {e}")
            failed_downloads.append(file_name)
    
    # Check if we have any successfully loaded resumes
    if not resumes:
        raise ValueError("Failed to load any resumes from Supabase storage")
    
    # Create a response message
    success_msg = f"Successfully loaded {len(resumes)} resumes from Supabase storage."
    if failed_downloads:
        success_msg += f" Failed to load: {', '.join(failed_downloads)}"
    
    response = AIMessage(content=success_msg)
    
    # Return Command to route to criteria_discovery
    return Command(
        update={
            "messages": [response],
            "job_description": job_description,
            "company_info": company_info,
            "resumes": resumes
        },
        goto="criteria_discovery"
    )

async def criteria_discovery_node(state: ResumeRankerState) -> Command[Literal["process_resume_node"]]:
    """Run the criteria discovery agent to generate evaluation criteria.
    
    This node delegates to the criteria discovery graph to analyze the job description
    and generate weighted evaluation criteria.
    """
    # Create a copy of the state to pass to the criteria discovery graph
    subgraph_state = {
        "job_description": state.job_description,
        "company_info": state.company_info,
        "model": configuration.model,
        "provider": configuration.provider,
        "job_intelligence_temperature": configuration.temperature,
        "criteria_synthesis_temperature": configuration.criteria_temperature,
        "max_retries": configuration.max_retries,
        "conversation_log": state.conversation_log
    }
    
    # Run the criteria discovery graph
    result = await criteria_discovery_graph.ainvoke(subgraph_state)
    
    send_list = []
    for resume in state.resumes:
        new_state = copy.deepcopy(state)
        new_state.current_resume = resume
        new_state.evaluation_criteria = result.get("evaluation_criteria", [])
        new_state.conversation_log = result.get("conversation_log", state.conversation_log)
        send_list.append(Send("process_resume_node", new_state))
    
    return Command(
        goto=send_list,
        update={
            "evaluation_criteria": result.get("evaluation_criteria", []),
            "conversation_log": result.get("conversation_log", state.conversation_log)
        }
    )

async def process_resume_node(state: ResumeRankerState) -> Command[Literal["rank_resumes"]]:
    """Process a single resume using the resume analysis agent.
    
    This function processes one resume and returns the scored results.
    """
    # Get the resume to process (should be passed via Send)
    resume = state.current_resume
    
    # Create a copy of the state to pass to the resume analysis graph
    subgraph_state = {
        "current_resume": resume,
        "job_description": state.job_description,
        "company_info": state.company_info,
        "evaluation_criteria": state.evaluation_criteria,
        "model": configuration.model,
        "provider": configuration.provider,
        "scoring_temperature": configuration.scoring_temperature,
        "max_retries": configuration.max_retries,
        "conversation_log": state.conversation_log
    }
    
    # Run the resume analysis graph
    result = await resume_analysis_graph.ainvoke(subgraph_state)
    
    # Extract the aggregate scores
    final_score = result.get("final_score", {})
    detailed_feedback = result.get("detailed_feedback", "")
    score_breakdown = result.get("score_breakdown", {})
    cultural_fit_score = score_breakdown["cultural_fit"]["score"]
    skills_assessment_score = score_breakdown["skills_assessment"]["score"]
    professional_experience_score = score_breakdown["professional_experience"]["score"]
    education_growth_score = score_breakdown["education_growth"]["score"]

    
    # Return the scores for this resume in the format expected by the reducer
    resume_id = resume.get("id", "unknown")

    resume_output = [{resume_id: {"overall_score": final_score, 
                                            "cultural_fit_score": (cultural_fit_score / 5) * 100, 
                                            "skills_assessment_score": (skills_assessment_score / 5) * 100, 
                                            "professional_experience_score": (professional_experience_score / 5) * 100, 
                                            "education_growth_score": (education_growth_score / 5) * 100,
                                            "detailed_feedback": detailed_feedback}}]

    return Command(
        update={
            "resume_scores": [{resume_id: final_score}],
            "resume_outputs": resume_output
        },
        goto="rank_resumes"
    )


def rank_resumes(state: ResumeRankerState) -> Command[Literal["cleanup_temp_files"]]:
    """Rank resumes based on their scores and create final rankings.
    
    This node sorts resumes by their overall scores and creates a ranked list.
    """
    # Aggregate all resume scores into a single dictionary
    aggregated_scores = {}
    for score_dict in state.resume_scores:
        aggregated_scores.update(score_dict)
    
    # Create ranking list with resume details and scores
    rankings = []
    for resume in state.resumes:
        resume_id = resume.get("id", "unknown")
        overall_score = aggregated_scores.get(resume_id, {})
        
        ranking_entry = {
            "rank": 0,  # Will be set after sorting
            "resume_id": resume_id,
            "overall_score": overall_score,
            "resume_data": resume
        }
        rankings.append(ranking_entry)
    
    # Sort by overall score (descending - highest score first)
    rankings.sort(key=lambda x: x["overall_score"], reverse=True)
    
    # Assign ranks
    for i, ranking in enumerate(rankings):
        ranking["rank"] = i + 1
    
    # Create summary message
    top_candidate = rankings[0] if rankings else None
    summary_msg = f"Ranking complete! Top candidate: {top_candidate['resume_id']} with score {top_candidate['overall_score']:.2f}" if top_candidate else "No candidates found"
    
    response = AIMessage(content=summary_msg)
    
    # Return Command to route to cleanup
    return Command(
        update={
            "resume_rankings": rankings,
            "messages": [response]
        },
        goto="cleanup_temp_files"
    )

def cleanup_temp_files_node(state: ResumeRankerState) -> Command[Literal["final_output"]]:    
    """Clean up temporary files created during resume processing.
    
    This node runs after ranking is complete to clean up downloaded PDF files.
    """
    try:
        cleanup_temp_files(state.resumes)
        logger.info("Successfully cleaned up temporary files")
    except Exception as e:
        logger.error(f"Error during cleanup: {e}")
    
    return Command(
        goto="final_output"
    )

def final_output(state: ResumeRankerState) -> OutputState:
    """Generate the final output of the resume ranking agent."""
    return OutputState(
        final_rankings=state.resume_rankings,
        final_resume_output=state.resume_outputs
    )

# Define the graph
builder = StateGraph(ResumeRankerState, input=InputState, output=OutputState, config_schema=Configuration)

# Add nodes - no need for edges since we use Command for routing
builder.add_node("parse_input", parse_input)
builder.add_node("criteria_discovery", criteria_discovery_node)
builder.add_node("process_resume_node", process_resume_node)
builder.add_node("rank_resumes", rank_resumes)
builder.add_node("cleanup_temp_files", cleanup_temp_files_node)
builder.add_node("final_output", final_output)

# Only need to define the entry point - all other routing is handled by Command objects
builder.set_entry_point("parse_input")
builder.set_finish_point("final_output")

# Compile the graph
graph = builder.compile(name="resume_ranker") 