"""Define a custom Reasoning and Action agent.

Works with a chat model with tool calling support.
"""
import logging
import json

from datetime import UTC, datetime
from typing import Dict, List, Literal, cast, Any

from langchain_core.messages import AIMessage, ToolMessage, HumanMessage
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph, START, END

from src.job_description_generator.configuration import Configuration
from src.job_description_generator.state import InputState, State
from src.job_description_generator.utils import load_chat_model, ConfigManager
from src.job_description_generator.tools import search
import src.job_description_generator.prompts as prompts

config_manager = ConfigManager("src/configs/gpt_4.1_nano.json")
configuration = Configuration.from_runnable_config(config_manager.get("job_description_generator"))

logger = logging.getLogger(__file__.split("langgraph_server")[1])

json_schema = {
    "name": "evaluate_job_description",
    "description": "Assess a job description and return a verdict, score, and detailed comments.",
    "parameters": {
        "title": "JobDescriptionEvaluation",
        "description": "Schema for the evaluation result of a job description",
        "type": "object",
        "properties": {
        "decision": {
            "type": "string",
            "enum": ["PASS", "NEEDS_REVISION"],
            "description": "The decision of the evaluator when assessing the job description"
        },
        "overall_score": {
            "type": "integer",
            "enum": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            "description": "The overall score of the evaluator when assessing the job description"
        },
        "comments": {
            "type": "string",
            "description": "Detailed feedback on different criteria of the job description"
        }
        },
        "required": ["decision", "overall_score", "comments"]
    }
}


tools = [search]
tools_by_name = {tool.name: tool for tool in tools}

# Create separate model instances for each node with different system prompts
base_model = load_chat_model(configuration.model, configuration.provider, configuration.temperature, configuration.max_retries)
job_title_analyzer_model = base_model.bind(stop=None)
job_description_gen_model = base_model.bind(stop=None)
evaluator_model = base_model.bind(stop=None)
post_processor_model = base_model.with_structured_output(json_schema)

# Tool-enabled model for general use
tool_enabled_model = base_model.bind_tools(tools)

def tool_node(state: State): 
    outputs = []
    for tool_call in state.messages[-1].tool_calls:
        tool_result = tools_by_name[tool_call["name"]].invoke(tool_call["args"])
        if isinstance(tool_result, set):
            tool_result = list(tool_result)

        outputs.append(ToolMessage(
            id=tool_call.id,
            content=tool_result,
            tool_calls=[tool_call]
            )
        )
    return {"messages": outputs}

async def job_title_analyzer(state: State) -> Dict[str, Any]:
    """Analyze the job title and requirements.
    
    This node extracts and analyzes the key components of the job request.
    """
    
    user_input = state.messages[0].content
    
    try:
        input_data = json.loads(user_input)
        company_name = input_data.get("company_name", "")
        company_description = input_data.get("company_description", "")
        job_title = input_data.get("job_title", "")
        job_requirements = input_data.get("required_experience", "")
        job_criteria = input_data.get("required_technical_skills", "")
        soft_skills = input_data.get("soft_skills", "")
        working_conditions = input_data.get("working_conditions", "")
        education_requirements = input_data.get("education_requirements", "")
        key_responsibilities = input_data.get("key_responsibilities", "")
    except json.JSONDecodeError:
        raise ValueError("Failed to parse user input as JSON, please try again.")
    
    # Format the system prompt
    system_message = prompts.JOB_TITLE_ANALYZER_PROMPT.format(
        company_name=company_name,
        company_description=company_description,
        job_title=job_title,
        required_experience=job_requirements,
        required_technical_skills=job_criteria,
        soft_skills=soft_skills,
        working_conditions=working_conditions,
        education_requirements=education_requirements,
        key_responsibilities=key_responsibilities,
    )
    
    # Get the model's response
    response = cast(
        AIMessage,
        await job_title_analyzer_model.ainvoke(
            [{"role": "system", "content": system_message}, {"role": "user", "content": user_input}]
        ),
    )
    
    analysis = {
        "full_analysis": response.content,
        "original_input": user_input
    }
    
    # Update state with analysis
    return {
        "messages": [response],
        "analysis": analysis
    }

async def job_description_gen(state: State) -> Dict[str, Any]:
    """Generate a job description based on the analysis.
    
    This node creates a structured job description using the analysis from the previous node.
    """
    # Format the system prompt
    system_message = prompts.JOB_DESCRIPTION_GEN_PROMPT.format(
        system_time=datetime.now(tz=UTC).isoformat()
    )
    
    # Create a prompt with the analyzed information
    user_content = f"""
    Please generate a job description based on the following analysis:
    
    {state.analysis["full_analysis"]}
    
    Create a well-structured, professional job description that addresses all the requirements and criteria.
    """
    
    # Get the model's response
    response = cast(
        AIMessage,
        await job_description_gen_model.ainvoke(
            [{"role": "system", "content": system_message}, 
             {"role": "user", "content": user_content}]
        ),
    )
    
    # Return the generated job description
    return {
        "messages": [response],
        "job_description": response.content
    }

async def evaluator(state: State) -> Dict[str, Any]:
    """Evaluate the generated job description.
    
    This node assesses the quality of the job description and decides if it needs revision.
    """
    # Format the system prompt
    system_message = prompts.EVALUATOR_PROMPT.format(
        system_time=datetime.now(tz=UTC).isoformat()
    )
    
    # Create a prompt with the job description and original requirements
    user_content = f"""
    Please evaluate the following job description against the original requirements:
    
    ORIGINAL ANALYSIS:
    {state.analysis["full_analysis"]}
    
    GENERATED JOB DESCRIPTION:
    {state.job_description}
    
    Provide your evaluation and clearly state if this description PASSES or NEEDS_REVISION.
    """
    
    # Get the model's response
    response = cast(
        AIMessage,
        await evaluator_model.ainvoke(
            [{"role": "system", "content": system_message}, {"role": "user", "content": user_content}]
        ),
    )
    
    # Extract the decision (PASS or NEEDS_REVISION)
    decision = "NEEDS_REVISION"  # Default to revision if we can't clearly detect
    if "PASS" in response.content:
        decision = "PASS"
    
    # Calculate new revision count
    revision_count = state.revision_count
    if decision == "NEEDS_REVISION":
        revision_count += 1
    
    # If we've reached max revisions, force a PASS
    if revision_count >= state.max_revisions:
        decision = "PASS"
        
    # Return the evaluation and decision
    return {
        "messages": [response],
        "evaluation": {"full_evaluation": response.content},
        "evaluation_decision": decision,
        "revision_count": revision_count
    }

async def post_processor(state: State) -> Dict[str, Any]:
    """Format the final job description.
    
    This node prepares the job description for presentation by applying final formatting.
    """
    # Format the system prompt
    system_message = prompts.POST_PROCESSOR_PROMPT.format(
        system_time=datetime.now(tz=UTC).isoformat()
    )
    
    # Create a prompt with the approved job description
    user_content = f"""
    Please format the following approved job description according to professional standards:
    
    {state.job_description}
    
    Apply professional formatting while preserving all content.
    """
    
    # Get the model's response
    response = cast(
        AIMessage,
        await post_processor_model.ainvoke(
            [{"role": "system", "content": system_message}, {"role": "user", "content": user_content}]
        ),
    )
    
    # Return the formatted job description and a final message to the user
    final_message = AIMessage(content=f"Here is your professionally formatted job description:\n\n{response.content}")
    
    return {
        "messages": [final_message],
        "formatted_job_description": response.content
    }

def decide_after_evaluation(state: State) -> Literal["job_description_gen", "post_processor"]:
    """Determine whether to revise the job description or move to post-processing.
    
    This function routes the workflow based on the evaluator's decision.
    """
    if state.evaluation_decision == "PASS":
        return "post_processor"
    else:
        return "job_description_gen"

# Define the graph
builder = StateGraph(State, input=InputState, config_schema=Configuration)

# Add all our nodes
builder.add_node("job_title_analyzer", job_title_analyzer)
builder.add_node("job_description_gen", job_description_gen)
builder.add_node("evaluator", evaluator)
builder.add_node("post_processor", post_processor)

# Define the edges
builder.add_edge(START, "job_title_analyzer")
builder.add_edge("job_title_analyzer", "job_description_gen")
builder.add_edge("job_description_gen", "evaluator")

# Add conditional edge from evaluator
builder.add_conditional_edges(
    "evaluator",
    decide_after_evaluation
)

# Add the final edge
builder.add_edge("post_processor", END)

# Compile the graph
graph = builder.compile(name="job_description_generator")

