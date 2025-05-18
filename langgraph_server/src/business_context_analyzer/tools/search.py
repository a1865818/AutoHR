"""This module provides example tools for web scraping and search functionality.

It includes a basic Tavily search function (as an example)

These tools are intended as free examples to get started. For production use,
consider implementing more robust and specialized tools tailored to your needs.
"""


from src.business_context_analyzer.configuration import Configuration
from src.business_context_analyzer.utils import ConfigManager

import logging
import os

from langchain_community.tools import BraveSearch, DuckDuckGoSearchResults, TavilySearchResults
from langchain_community.tools.arxiv import ArxivQueryRun
from langchain_community.utilities import ArxivAPIWrapper, BraveSearchWrapper

config_manager = ConfigManager("src/configs/gpt_4.1_nano.json")
configuration = Configuration.from_runnable_config(config_manager.get("business_context_analyzer"))

SEARCH_MAX_RESULTS = configuration.max_search_results

logger = logging.getLogger(__file__.split("langgraph_server")[1])

tavily_search_tool = TavilySearchResults(
    name="web_search",
    max_results=SEARCH_MAX_RESULTS,
    include_raw_content=True,
    include_images=True,
    include_image_descriptions=True
)

duckduckgo_search_tool = DuckDuckGoSearchResults(
    name="web_search", max_results=SEARCH_MAX_RESULTS
)

brave_search_tool = BraveSearch(
    name="web_search",
    search_wrapper=BraveSearchWrapper(
        api_key=os.getenv("BRAVE_SEARCH_API_KEY", ""),
        search_kwargs={"count": SEARCH_MAX_RESULTS},
    ),
)

arxiv_search_tool = ArxivQueryRun(
    name="web_search",
    api_wrapper=ArxivAPIWrapper(
        top_k_results=SEARCH_MAX_RESULTS,
        load_max_docs=SEARCH_MAX_RESULTS,
        load_all_available_meta=True,
    ),
)

# if __name__ == "__main__":
#     results = LoggedDuckDuckGoSearch(
#         name="web_search", max_results=SEARCH_MAX_RESULTS, output_format="list"
#     ).invoke("cute panda")
#     print(json.dumps(results, indent=2, ensure_ascii=False))
