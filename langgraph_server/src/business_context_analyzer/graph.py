"""Define a custom Reasoning and Action agent.

Works with a chat model with tool calling support.
"""
import logging
import json

from typing import Dict, List, Literal, cast, Any
from pydantic import BaseModel, Field

from langchain_core.messages import AIMessage, ToolMessage, HumanMessage
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode

from src.business_context_analyzer.configuration import Configuration
from src.business_context_analyzer.state import InputState, State
from src.business_context_analyzer.utils import load_chat_model, ConfigManager
from src.business_context_analyzer.tools import search
import src.business_context_analyzer.prompts as prompt
from dotenv import load_dotenv
load_dotenv()

config_manager = ConfigManager("src/configs/gpt_4.1_nano.json")
configuration = Configuration.from_runnable_config(config_manager.get("business_context_analyzer"))

logger = logging.getLogger(__file__.split("langgraph_server")[1])

json_schema = {
    "title": "BusinessContext",
    "description": "A concise description of the company",
    "type": "object",
    "properties": {
        "company_name": {"type": "string", "description": "The name of the company"},
        "company_description": {"type": "string", "description": "A concise description of the company"}
    },
    "required": ["company_description"]
}


# Create separate model instances for each node with different system prompts
tools = [search]
tools_by_name = {tool.name: tool for tool in tools}

base_model = load_chat_model(configuration.model, configuration.provider, configuration.temperature, configuration.max_retries)
business_context_analyzer = base_model.bind_tools(tools)
json_schema_model = base_model.with_structured_output(json_schema)

async def tool_node(state: State): 
    outputs = []
    for tool_call in state.messages[-1].tool_calls:
        tool_result = await tools_by_name[tool_call["name"]].ainvoke(tool_call["args"])
        
        # Ensure the result is serializable
        if isinstance(tool_result, set):
            tool_result = list(tool_result)

        outputs.append(ToolMessage(
            tool_call_id=tool_call["id"],
            content=tool_result,
            tool_calls=[tool_call]
            )
        )
    return {"messages": outputs}

async def call_model(state: State) -> Dict[str, Any]:
    """
    Generate a response using the model based on the current state.
    
    This function processes the input and generates a response that can either 
    use tools or provide a final analysis.
    """
    # Extract input information
    input_msg = state.messages[0].content
    input_content = json.loads(input_msg)
    company_name = input_content.get("company_name", "")
    company_website = input_content.get("company_website", "")
    
    # Format the system prompt
    system_message = prompt.BUSINESS_CONTEXT_ANALYZER_PROMPT.format(
        company_name=company_name,
        company_website=company_website
    )
    
    # Collect all messages for the model
    messages = [
        {"role": "system", "content": system_message}
    ]
    
    # Get the model's response
    response = cast(
        AIMessage,
        await business_context_analyzer.ainvoke(messages + state.messages)
    )

    return {
        "messages": [response],
        "company_name": company_name,
        "company_website": company_website
    }

async def response(state: State) -> Dict[str, Any]:
    """
    Generate a simplified JSON schema with company name and description.
    
    This node takes the final analysis from the conversation and formats it according to
    the expected schema.
    """
    # Format the system prompt
    system_prompt = prompt.BUSINESS_CONTEXT_FORMATTER_PROMPT.format(
        company_name=state.company_name
    )

    # messages = [{"role": "system", "content": system_prompt}]
    
    # Get the model's response
    messages = [{"role": "system", "content": system_prompt}] + state.messages  # append the existing list of messages

    # now pass the list directly to ainvoke()
    response = await json_schema_model.ainvoke(messages)
    
    # Parse the JSON response
    try:
        schema_data = response
        
        # Validate expected fields exist
        if "company_name" not in schema_data or "company_description" not in schema_data:
            raise ValueError("Response missing required fields")
            
        # Create a final message for the user
        final_message = AIMessage(content=json.dumps(schema_data, indent=2))
        
        return {
            "messages": state.messages + [final_message],
            "business_context": schema_data
        }
        
    except (json.JSONDecodeError, ValueError) as e:
        # If JSON parsing failed, return an error
        error_message = AIMessage(content=f"Error extracting business context: {str(e)}")
        return {
            "messages": state.messages + [error_message],
            "business_context": {
                "company_name": "Unknown",
                "company_description": "Could not extract valid business context."
            }
        }

def route_model_output(state: State) -> Literal["response", "tool_node"]:
    """Determine the next node based on the model's output.

    This function checks if the model's last message contains tool calls.

    Args:
        state (State): The current state of the conversation.

    Returns:
        str: The name of the next node to call.
    """
    last_message = state.messages[-1]
    if not last_message.tool_calls:
        return "response"
    
    # Otherwise go to the response formatter
    return "tool_node"

# Define the graph
builder = StateGraph(State, input=InputState)

# Add all our nodes
# Add nodes for business context analysis
builder.add_node("tool_node", tool_node)
builder.add_node("agent", call_model)
builder.add_node("response", response)

# Define the edges
builder.add_edge(START, "agent")
builder.add_conditional_edges("agent", route_model_output,
                              {"tool_node": "tool_node",
                               "response": "response"})
builder.add_edge("tool_node", "agent")
builder.add_edge("response", END)

# Compile the graph
graph = builder.compile(name="business_context_analyzer")

