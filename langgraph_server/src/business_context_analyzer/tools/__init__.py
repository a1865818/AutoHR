from .search import tavily_search_tool, duckduckgo_search_tool, brave_search_tool, arxiv_search_tool
from .crawl import crawl_tool

from src.business_context_analyzer.utils import ConfigManager
from src.business_context_analyzer.configuration import Configuration
from langchain_core.tools import StructuredTool

config_manager = ConfigManager("src/configs/gpt_4.1_nano.json")
configuration = Configuration.from_runnable_config(config_manager.get("business_context_analyzer"))

SEARCH_MAX_RESULTS = configuration.max_search_results
SEARCH_ENGINE = configuration.search_engine


search_tool_mappings = {
    "tavily": tavily_search_tool,
    "duckduckgo": duckduckgo_search_tool,
    "brave_search": brave_search_tool,
    "arxiv": arxiv_search_tool,
}

web_search_tool = search_tool_mappings.get(SEARCH_ENGINE, tavily_search_tool)



__all__ = [
    "crawl_tool",
    "web_search_tool"]