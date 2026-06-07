"""Utility & helper functions."""

from langchain.chat_models import init_chat_model
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import BaseMessage

import os
import json
from typing import Any, Dict
from copy import deepcopy
from pathlib import Path
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
    kwargs: Dict[str, Any] = {"temperature": temperature, "max_retries": max_retries}
    if provider == "azure_openai":
        # Azure OpenAI requires an explicit api-version and routes requests by deployment
        # name (which may differ from the model name). The endpoint and key are read from
        # AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_API_KEY automatically by AzureChatOpenAI.
        kwargs["api_version"] = os.getenv("OPENAI_API_VERSION", "2025-04-01-preview")
        azure_deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT")
        if azure_deployment:
            kwargs["azure_deployment"] = azure_deployment
    return init_chat_model(model, model_provider=provider, **kwargs)

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

    
    