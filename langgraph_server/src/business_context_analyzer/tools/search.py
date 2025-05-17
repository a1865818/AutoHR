"""This module provides example tools for web scraping and search functionality.

It includes a basic Tavily search function (as an example)

These tools are intended as free examples to get started. For production use,
consider implementing more robust and specialized tools tailored to your needs.
"""

from typing import Any, Callable, Dict, List, Optional, cast
import json

from langchain_tavily import TavilySearch  
from langchain_community.tools import BraveSearch
from langchain_core.tools import tool

from src.business_context_analyzer.configuration import Configuration
from src.business_context_analyzer.utils import ConfigManager

config_manager = ConfigManager("src/configs/gpt_4.1_nano.json")
configuration = Configuration.from_runnable_config(config_manager.get("business_context_analyzer"))


@tool
async def search(query: str, include_domains: Optional[List[str]] = None) -> str:
    """Search for general web results.

    This function performs a search using the Tavily search engine, which is designed
    to provide comprehensive, accurate, and trusted results. It's particularly useful
    for answering questions about current events.
    """

    if configuration.search_engine == "tavily":
        search_engine = TavilySearch(
            max_results=configuration.max_search_results, 
            include_raw_content=True,
            include_domains=include_domains
        )
    else:
        pass
        # search_engine = BraveSearch(
        #     max_results=configuration.max_search_results, 
        #     include_raw_content=True,
        #     include_domains=include_domains
        # )
    
    return cast(dict[str, Any], await search_engine.ainvoke({"query": query}))