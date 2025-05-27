from langgraph.prebuilt import create_react_agent

from src.business_context_analyzer.tools import (
    crawl_tool,
    web_search_tool,
)

from src.business_context_analyzer.utils import load_chat_model, ConfigManager
from src.business_context_analyzer.configuration import Configuration
from src.business_context_analyzer.prompts import get_prompt_template
config_manager = ConfigManager("src/configs/gpt_4.1_nano.json")
configuration = Configuration.from_runnable_config(config_manager.get("business_context_analyzer"))

base_model = load_chat_model(configuration.model, configuration.provider, configuration.temperature, configuration.max_retries)


# Create agents using configured LLM types
def create_agent(agent_name: str, tools: list, prompt_template: str):
    """Factory function to create agents with consistent configuration."""
    return create_react_agent(
        name=agent_name,
        model=base_model,
        tools=tools,
        prompt=get_prompt_template(prompt_template),
    )


# Create agents using the factory function
research_agent = create_agent(
    "researcher", [web_search_tool, crawl_tool], "researcher"
)
