"""Utility & helper functions."""

from langchain.chat_models import init_chat_model
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import BaseMessage

import json
from typing import Any
from copy import deepcopy
from pathlib import Path


import os
import asyncio
from pathlib import Path
from typing import Union
from crawl4ai.async_webcrawler import AsyncWebCrawler as _BaseCrawler
from crawl4ai import BrowserConfig, ProxyConfig
from crawl4ai.async_crawler_strategy import AsyncPlaywrightCrawlerStrategy
from crawl4ai import AsyncLogger, AsyncLoggerBase
from fake_useragent import FakeUserAgentError
from crawl4ai.async_configs import ValidUAGenerator
from crawl4ai import BrowserConfig as _BaseConfig

async def _ensure_dirs(path: str):
    """Asynchronously create cache directories without blocking the event loop."""
    # main folder
    await asyncio.to_thread(os.makedirs, path, True)
    # cache subfolder
    await asyncio.to_thread(os.makedirs, f"{path}/cache", True)

class AsyncWebCrawlerNoBlock(_BaseCrawler):
    """
    A drop-in replacement for AsyncWebCrawler that avoids blocking os.makedirs
    in __init__, and instead creates cache dirs in start() via asyncio.to_thread().
    """

    def __init__(
        self,
        crawler_strategy = None,
        config: BrowserConfig = None,
        base_directory: str = str(os.getenv("CRAWL4_AI_BASE_DIRECTORY", str(Path.home()))),
        thread_safe: bool = False,
        logger: AsyncLoggerBase = None,
        **kwargs,
    ):
        # 1) Handle browser configuration
        browser_config = config or BrowserConfig()
        self.browser_config = browser_config

        # 2) Initialize logger
        self.logger = logger or AsyncLogger(
            verbose=self.browser_config.verbose,
            tag_width=10,
        )

        # 3) Initialize crawler strategy
        params = {k: v for k, v in kwargs.items() if k in ["browser_config", "logger"]}
        self.crawler_strategy = crawler_strategy or AsyncPlaywrightCrawlerStrategy(
            browser_config=browser_config,
            logger=self.logger,
            **params,
        )

        # 4) Thread-safety lock
        self._lock = asyncio.Lock() if thread_safe else None

        # 5) Save base directory but do NOT mkdir here
        self.base_directory = base_directory
        self.crawl4ai_folder = os.path.join(self.base_directory, ".crawl4ai")

        # Note: We deliberately skip os.makedirs here!

        # 6) Ready flag (inherited)
        self.ready = False

    async def start(self):
        """
        Create cache dirs without blocking, then proceed with the normal startup.
        """
        # 1) Ensure cache folders exist (non-blocking)
        await _ensure_dirs(self.crawl4ai_folder)

        # 2) Call the original start logic
        await super().start()

    # arun, close, etc. are inherited unchanged


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



def get_message_text(msg: BaseMessage) -> str:
    """Get the text content of a message."""
    content = msg.content
    if isinstance(content, str):
        return content
    elif isinstance(content, dict):
        return content.get("text", "")
    else:
        txts = [c if isinstance(c, str) else (c.get("text") or "") for c in content]
        return "".join(txts).strip()


def load_chat_model(model: str, provider: str, temperature: float, max_retries: int) -> BaseChatModel:
    """Load a chat model from a fully specified name.

    Args:
        model (str): The model name.
        provider (str): The provider name.
        temperature (float): The temperature for the model.
        max_retries (int): The maximum number of retries for the model.
    """
    return init_chat_model(model, model_provider=provider, temperature=temperature, max_retries=max_retries)

class ConfigManager:
    """A manager for configuration settings."""

    def __init__(self, config_path: str):
        self.config_path = config_path
        self.config = self._load_config()

    def get(self, key: str, default: Any = None) -> Any:
        return self.config.get(key, default)
    
    def _load_config(self) -> dict:
        """Load the configuration from the environment variables."""
        path = Path(self.config_path)
        if not path.exists():
            raise FileNotFoundError(f"Configuration file not found at {path}")
        with open(path, "r") as f:
            return json.load(f)
        
    def get_graph_config(self, graph_key: str, defaults: Any = None) -> dict:
        """ Retrieve and Merge config for a specific graph """
        
        defaults = defaults or {}
        merged = deepcopy(defaults)
        user_config = self.get(graph_key, {})
        if "configurable" in user_config:
            merged.update(user_config["configurable"])
        else:
            merged.update(user_config)
        return {"configurable": merged}

    
