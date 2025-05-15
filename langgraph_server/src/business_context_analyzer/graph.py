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

from src.business_context_scraper.configuration import Configuration
from src.business_context_scraper.state import InputState, State
from src.business_context_scraper.utils import load_chat_model, ConfigManager, AsyncWebCrawlerNoBlock
from src.business_context_scraper.tools import search
import src.business_context_scraper.prompts as prompts
from crawl4ai.deep_crawling import BFSDeepCrawlStrategy
from crawl4ai.content_scraping_strategy import LXMLWebScrapingStrategy

import json
from pydantic import BaseModel, Field
from typing import List, Union
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode, LLMConfig
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

from fake_useragent import FakeUserAgent as _BaseUA
from fake_useragent.errors import FakeUserAgentError
import json
from crawl4ai import BrowserConfig as _BaseConfig
from crawl4ai.async_configs import ValidUAGenerator
from fake_useragent import FakeUserAgentError




class BrowserConfigWithLocalUA(_BaseConfig):
    """
    Extends the default BrowserConfig to allow loading a custom
    browsers.jsonl (or JSON) for user-agent generation.
    """

    def __init__(
        self,
        *args,
        ua_json_path: Union[str, Path] = None,
        **kwargs
    ):
        """
        :param ua_json_path: path to your custom `browsers.jsonl` file.
                             If provided and user_agent_mode=="random", the
                             UA generator will load from here.
        All other args/kwargs are passed through to the base BrowserConfig.
        """
        super().__init__(*args, **kwargs)
        self._ua_json_path = Path(ua_json_path) if ua_json_path else None

        # If random UA is requested, override generator to load from your file
        if self.user_agent_mode == "random":
            try:
                if self._ua_json_path and self._ua_json_path.exists():
                    # tell the ValidUAGenerator to load from your file
                    self._ua_gen = ValidUAGenerator(cache_path=str(self._ua_json_path))
                else:
                    # fallback to default behavior
                    self._ua_gen = ValidUAGenerator()
                self.user_agent = self._ua_gen.generate(**(self.user_agent_generator_config or {}))
            except (FakeUserAgentError, TypeError):
                # if loading fails, fall back to the static default UA
                pass

# class CustomUA(_BaseUA):
#     def __init__(self, jsonl_path: Path, *args, **kwargs):
#         self._jsonl_path = jsonl_path
#         super().__init__(*args, **kwargs)
#         self.data_browsers = self.data_browsers_loader()

#     def data_browsers_loader(self):
#         try:
#             lines = self._jsonl_path.read_text().splitlines()
#             return [json.loads(l) for l in lines]
#         except Exception as e:
#             raise FakeUserAgentError(f"Failed loading {self._jsonl_path}") from e

browser_config = BrowserConfigWithLocalUA(ua_json_path="/Users/nguyendangquang/AutoHR/langgraph_server/browsers.jsonl")

config_manager = ConfigManager("src/configs/gpt_4.1_nano.json")
configuration = Configuration.from_runnable_config(config_manager.get("business_context_scraper"))

logger = logging.getLogger(__file__.split("langgraph_server")[1])

json_schema = {
    "title": "BusinessContext",
    "description": "A concise description of the company",
    "type": "object",
    "properties": {
        "company_name": {"type": "string", "description": "The name of the company"},
        "company_description": {"type": "string", "description": "A concise description of the company"}
    },
    "required": ["company_name", "company_description"]
}

# Create separate model instances for each node with different system prompts
base_model = load_chat_model(configuration.model, configuration.provider, configuration.temperature, configuration.max_retries)
business_context_analyzer = base_model.bind(stop=None)
json_schema_model = base_model.with_structured_output(json_schema)

async def discover_important_urls(state: State) -> List[str]:
    """Discover and prioritize important URLs from the company website."""
    
    # Configure the deep crawler to find important pages
    config = CrawlerRunConfig(
        deep_crawl_strategy=BFSDeepCrawlStrategy(
            max_depth=1, 
            include_external=False
        ),
        scraping_strategy=LXMLWebScrapingStrategy(),
        verbose=True
    )
    
    input_msg = state.messages[0].content
    input_content = json.loads(input_msg)
    base_url = input_content.get("url", "")
    top_k = input_content.get("top_k", 5)
    
    results = []
    async with AsyncWebCrawlerNoBlock(config=browser_config) as crawler:
        # Use BFS strategy to prioritize breadth of content
        result = await crawler.arun(
            url=base_url,
            config=config,
            deep_crawl_strategy="bfs"  # Breadth-first search
        )
        
        # Extract discovered URLs, filtering out non-HTML content
        dict_results = {}
        for page_result in result[:top_k]:
            dict_results["url"] = page_result.url
            dict_results["title"] = page_result.metadata.get('title', '')
            dict_results["content"] = page_result.markdown
            results.append(dict_results)
    return results

async def call_model(state: State) -> Dict[str, Any]:
    """
    Analyze company information from all retrieved important URLs.
    
    This node processes all the gathered content from important URLs and uses an LLM
    to analyze the business context comprehensively.
    """
    # Get all the discovered URLs and their content
    discovered_urls = state.discovered_urls if hasattr(state, 'discovered_urls') else []
    
    # Format collected content for analysis
    combined_content = ""
    
    if discovered_urls:
        # Build a comprehensive document from all URLs
        combined_content += f"# COMPANY ANALYSIS FOR: {state.company_name}\n\n"
        
        for i, url_data in enumerate(discovered_urls):
            combined_content += f"## SOURCE {i+1}: {url_data.get('title', 'No Title')}\n"
            combined_content += f"URL: {url_data.get('url', '')}\n\n"
            combined_content += url_data.get('content', 'No content available') + "\n\n"
            combined_content += "---\n\n"
    else:
        # If no URLs were discovered, use the original website content
        combined_content = f"# COMPANY ANALYSIS FOR: {state.company_name}\n\n"
        combined_content += state.raw_website_content.get("main_website", {}).get("content", "No content available")
    
    # Format the system prompt
    system_message = prompts.BUSINESS_CONTEXT_ANALYZER_PROMPT.format(
        company_name=state.company_name,
        company_website=state.company_website
    )
    
    # Get the model's analysis
    response = cast(
        AIMessage,
        await business_context_analyzer.ainvoke(
            [{"role": "system", "content": system_message}, 
             {"role": "user", "content": combined_content}]
        ),
    )
    
    # Attempt to parse structured data
    try:
        analysis_data = json.loads(response.content)
    except json.JSONDecodeError:
        # If parsing fails, store raw response
        analysis_data = {
            "raw_analysis": response.content,
            "parsed_successfully": False
        }
    
    return {
        "messages": [response],
        "analysis_result": analysis_data,
        "source_count": len(discovered_urls)
    }

async def response(state: State) -> Dict[str, Any]:
    """
    Generate a simplified JSON schema with company name and description.
    
    This node takes the comprehensive analysis from the previous step and distills it
    into a minimal schema with just the company name and description.
    """
    # Format the system prompt
    system_message = """
    You are a business context distiller. Your task is to take a comprehensive business 
    analysis and extract only the most essential information about a company.
    
    Create a concise, accurate company description that captures:
    1. What the company does (core business/offering)
    2. Who they serve (target market)
    3. How they provide value (key differentiators/approach)
    4. Their market position (industry context)
    
    Limit your description to 1-2 paragraphs (max 250 words) that would give someone a
    clear understanding of the company's purpose and business model.
    
    Format your response as a valid JSON object with exactly two fields:
    - company_name: The official name of the company
    - company_description: Your concise description
    
    Ensure your output is valid JSON that can be parsed directly.
    """
    
    # Create input for the model
    analysis_result = state.analysis_result
    
    # Prepare user content based on what we have
    if isinstance(analysis_result, dict) and analysis_result.get("parsed_successfully") is False:
        # If we have raw analysis text
        user_content = f"""
        Based on the following raw business analysis, generate the requested JSON schema:
        
        {analysis_result.get('raw_analysis', '')}
        """
    else:
        # If we have structured data
        user_content = f"""
        Based on the following structured business analysis, generate the requested JSON schema:
        
        {json.dumps(analysis_result, indent=2)}
        """
    
    # Get the model's response
    response = cast(
        AIMessage,
        await json_schema_model.ainvoke(
            [{"role": "system", "content": system_message}, 
             {"role": "user", "content": user_content}]
        ),
    )
    
    # Parse the JSON response
    try:
        schema_data = json.loads(response.content)
        
        # Validate expected fields exist
        if "company_name" not in schema_data or "company_description" not in schema_data:
            raise ValueError("Response missing required fields")
            
        # Create a final message for the user
        final_message = AIMessage(content=f"""
        # Business Context Analysis Complete
        
        ## Company: {schema_data['company_name']}
        
        {schema_data['company_description']}
        
        *Analysis based on {state.source_count} sources from the company's web presence.*
        """)
        
        return {
            "messages": [final_message],
            "business_context": schema_data
        }
        
    except (json.JSONDecodeError, ValueError) as e:
        # If JSON parsing failed, attempt to extract the information manually
        raise Exception(f"Error parsing JSON: {str(e)}")
        
# Define the graph
builder = StateGraph(State, input=InputState, config_schema=Configuration)

# Add all our nodes
# Add nodes for business context analysis
builder.add_node("url_discoverer", discover_important_urls)
builder.add_node("content_analyzer", call_model)
builder.add_node("response", response)

# Define the edges
builder.add_edge(START, "url_discoverer")
builder.add_edge("url_discoverer", "content_analyzer")
builder.add_edge("content_analyzer", "response")
builder.add_edge("response", END)

# Compile the graph
graph = builder.compile(name="business_context_scraper")

