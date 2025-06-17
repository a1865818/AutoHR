"""Define the master orchestrator graph for resume ranking."""

import json
import logging
from typing import Dict, Any, List, cast, Literal

from langchain_core.messages import AIMessage, HumanMessage
from langgraph.graph import StateGraph, START, END

from src.resume_ranker.configuration import Configuration
from src.resume_ranker.state import ResumeRankerState, InputState
from src.resume_ranker.criteria_discovery_agent.graph import graph as criteria_discovery_graph
from src.resume_ranker.resume_analysis_agent.graph import graph as resume_analysis_graph
from src.resume_ranker.utils import load_chat_model, load_resume_from_file, load_resumes_from_directory, ConfigManager
import src.resume_ranker.prompts as prompts

logger = logging.getLogger(__file__.split("langgraph_server")[1])

# Load configuration
config_manager = ConfigManager("src/configs/gpt_4.1_nano.json")
configuration = Configuration.from_runnable_config(config_manager.get("resume_ranker"))

# Create model instances
base_model = load_chat_model(configuration.model, configuration.provider, configuration.temperature, configuration.max_retries)
orchestrator_model = base_model.bind(stop=None)
final_ranking_model = base_model.bind(temperature=configuration.scoring_temperature)

async def parse_input(state: ResumeRankerState) -> Dict[str, Any]:
    """Parse the input to extract job description, company information, and resumes.
    
    This node processes the initial input to prepare for the resume ranking workflow.
    """
    # Get the user input
    user_input = state.messages[0].content
    
    try:
        # Try to parse as JSON
        input_data = json.loads(user_input) if isinstance(user_input, str) else user_input
        
        # Extract job description
        job_description = input_data.get("job_description", "")
        if not job_description and "job_description_path" in input_data:
            with open(input_data["job_description_path"], "r") as f:
                job_description = f.read()
        
        # Extract company information
        company_info = input_data.get("company_info", "")
        if not company_info and "company_info_path" in input_data:
            with open(input_data["company_info_path"], "r") as f:
                company_info = f.read()
        
        # Extract resumes
        resumes = []
        if "resumes" in input_data:
            resumes = input_data["resumes"]
        elif "resume_paths" in input_data:
            for path in input_data["resume_paths"]:
                try:
                    resume = load_resume_from_file(path)
                    resumes.append(resume)
                except Exception as e:
                    logger.error(f"Error loading resume {path}: {e}")
        elif "resume_directory" in input_data:
            try:
                resumes = load_resumes_from_directory(input_data["resume_directory"])
            except Exception as e:
                logger.error(f"Error loading resumes from directory {input_data['resume_directory']}: {e}")
        
        # Validate input
        if not job_description:
            raise ValueError("Job description is required")
        
        if not resumes:
            raise ValueError("At least one resume is required")
            
    except json.JSONDecodeError:
        # If not JSON, assume it's a simple text input
        raise ValueError("Input must be a JSON object with job_description and resumes")
    
    # Create a response message
    response = AIMessage(
        content=f"Successfully parsed input: {len(resumes)} resumes to rank against the job description."
    )
    
    # Return the updated state
    return {
        "messages": [response],
        "job_description": job_description,
        "company_info": company_info,
        "resumes": resumes
    }

def criteria_discovery_node(state: ResumeRankerState) -> Dict[str, Any]:
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
    result = criteria_discovery_graph.invoke(subgraph_state)
    
    # Extract the relevant information from the result
    return {
        "evaluation_criteria": result.get("evaluation_criteria", []),
        "conversation_log": result.get("conversation_log", state.conversation_log)
    }

def process_resume(state: ResumeRankerState, resume_index: int) -> Dict[str, Any]:
    """Process a single resume using the resume analysis agent.
    
    This function is used to process each resume in parallel or sequentially.
    """
    # Check if the resume index is valid
    if resume_index >= len(state.resumes):
        logger.error(f"Invalid resume index: {resume_index}, only {len(state.resumes)} resumes available")
        return {}
    
    # Get the resume to process
    resume = state.resumes[resume_index]
    
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
    result = resume_analysis_graph.invoke(subgraph_state)
    
    # Extract the aggregate scores
    aggregate_scores = result.get("aggregate_scores", {})
    
    # Return the scores for this resume
    return {
        "resume_id": resume.get("id", f"resume_{resume_index}"),
        "scores": aggregate_scores
    }

def process_resumes_node(state: ResumeRankerState) -> Dict[str, Any]:
    """Process all resumes using the resume analysis agent.
    
    This node delegates to the resume analysis graph for each resume and collects the results.
    """
    # Process each resume
    resume_scores = {}
    for i in range(len(state.resumes)):
        result = process_resume(state, i)
        resume_id = result.get("resume_id", f"resume_{i}")
        resume_scores[resume_id] = result.get("scores", {})
    
    # Create a response message
    response = AIMessage(
        content=f"Completed analysis of {len(resume_scores)} resumes."
    )
    
    # Return the updated state
    return {
        "messages": [response],
        "resume_scores": resume_scores
    }

async def generate_final_ranking(state: ResumeRankerState) -> Dict[str, Any]:
    """Generate the final ranking of resumes.
    
    This node aggregates the scores from all resumes, ranks them, and provides a summary.
    """
    # Convert criteria and scores to JSON for the prompt
    criteria_json = json.dumps(state.evaluation_criteria, indent=2)
    scores_json = json.dumps(state.resume_scores, indent=2)
    
    # Format the prompt
    prompt = prompts.FINAL_RANKING_PROMPT_TEMPLATE.format(
        criteria_json=criteria_json,
        scores_json=scores_json
    )
    
    # Get the model's response
    response = cast(
        AIMessage,
        await final_ranking_model.ainvoke(
            [
                {"role": "system", "content": prompts.FINAL_RANKING_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ]
        ),
    )
    
    # Parse the response to extract the rankings
    rankings = []
    try:
        # Try to extract JSON from the response
        response_text = response.content
        # Find JSON array in the response
        start_idx = response_text.find("[")
        end_idx = response_text.rfind("]") + 1
        if start_idx >= 0 and end_idx > start_idx:
            json_str = response_text[start_idx:end_idx]
            rankings = json.loads(json_str)
        else:
            logger.error("Could not find JSON array in response")
    except Exception as e:
        logger.error(f"Error parsing final rankings: {e}")
    
    # Create a summary of the rankings
    summary = "\n\n### Resume Rankings\n\n"
    for i, ranking in enumerate(rankings):
        resume_id = ranking.get("resume_id", "Unknown")
        score = ranking.get("score", 0)
        recommendation = ranking.get("recommendation", "Unknown")
        summary += f"{i+1}. {resume_id}: Score {score} - {recommendation}\n"
    
    # Create a response message with the summary
    final_response = AIMessage(
        content=f"Resume ranking complete. {len(rankings)} resumes ranked.\n{summary}"
    )
    
    # Return the updated state
    return {
        "messages": [final_response],
        "final_rankings": rankings
    }

# Define the graph
builder = StateGraph(ResumeRankerState, input=InputState, config_schema=Configuration)

# Add nodes
builder.add_node("parse_input", parse_input)
builder.add_node("criteria_discovery", criteria_discovery_node)
builder.add_node("process_resumes", process_resumes_node)
builder.add_node("generate_final_ranking", generate_final_ranking)

# Define edges
builder.add_edge(START, "parse_input")
builder.add_edge("parse_input", "criteria_discovery")
builder.add_edge("criteria_discovery", "process_resumes")
builder.add_edge("process_resumes", "generate_final_ranking")
builder.add_edge("generate_final_ranking", END)

# Compile the graph
graph = builder.compile(name="resume_ranker") 