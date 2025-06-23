"""Utility & helper functions for resume ranking."""

import json
import os
import tempfile
from pathlib import Path
from typing import Any, Dict, List
import fitz

from langchain.chat_models import init_chat_model
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import BaseMessage
from dotenv import load_dotenv
from supabase import create_client, Client

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


def load_resume_from_file(file_path: str) -> Dict[str, Any]:
    """Load a resume from a file.
    
    Args:
        file_path (str): Path to the resume file.
        
    Returns:
        Dict[str, Any]: Dictionary with resume text and metadata.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Resume file not found at {path}")
    
    # Get file extension to determine processing method
    file_ext = path.suffix.lower()
    
    # Extract filename as resume ID
    resume_id = path.stem
    
    # Simple text extraction for now - in production would use proper parsers for different formats
    if file_ext in ['.txt', '.md']:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
    elif file_ext == '.json':
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    else:
        # For PDF and other formats, would integrate with appropriate libraries
        # For now, just read as text
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
    
    return {
        "id": resume_id,
        "filename": path.name,
        "content": content,
        "file_path": str(path)
    }


def load_resumes_from_directory(directory_path: str) -> List[Dict[str, Any]]:
    """Load all resumes from a directory.
    
    Args:
        directory_path (str): Path to directory containing resume files.
        
    Returns:
        List[Dict[str, Any]]: List of dictionaries with resume text and metadata.
    """
    path = Path(directory_path)
    if not path.exists() or not path.is_dir():
        raise FileNotFoundError(f"Directory not found at {path}")
    
    resumes = []
    for file_path in path.glob("*.*"):
        try:
            resume = load_resume_from_file(str(file_path))
            resumes.append(resume)
        except Exception as e:
            print(f"Error loading resume {file_path}: {e}")
    
    return resumes


def weighted_scoring(criteria: List[Dict[str, Any]], section_scores: Dict[str, float]) -> float:
    """Calculate weighted score based on criteria weights and section scores.
    
    Args:
        criteria (List[Dict[str, Any]]): List of criteria with weights.
        section_scores (Dict[str, float]): Dictionary of scores by criterion name.
        
    Returns:
        float: Weighted score.
    """
    total = 0.0
    total_weight = 0.0
    
    for c in criteria:
        name, weight = c["name"], c["weight"]
        if name in section_scores:
            total += weight * section_scores[name]
            total_weight += weight
    
    # Normalize by total weight if not zero
    if total_weight > 0:
        return round(total / total_weight * 10, 2)  # Scale to 0-10
    return 0.0


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
        merged = defaults.copy()
        user_config = self.get(graph_key, {})
        if "configurable" in user_config:
            merged.update(user_config["configurable"])
        else:
            merged.update(user_config)
        return {"configurable": merged}

# Load environment variables
load_dotenv("langgraph_server/.env")

def get_supabase_client() -> Client:
    """Get a Supabase client instance."""
    return create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def download_pdf_to_temp(bucket_name: str, file_name: str) -> str:
    """Download a PDF from Supabase storage to a temporary file.
    
    Args:
        bucket_name (str): The name of the Supabase storage bucket
        file_name (str): The name of the file to download
        
    Returns:
        str: Path to the temporary file, or None if download failed
    """
    try:
        supabase = get_supabase_client()
        
        # Download from Supabase storage
        response = supabase.storage.from_(bucket_name).download(file_name)
    
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            temp_file.write(response)
            temp_path = temp_file.name
            
        print(f"PDF saved to: {temp_path}")
        return temp_path
        
    except Exception as e:
        print(f"Error downloading {file_name}: {e}")
        return None

def load_resume_from_supabase(bucket_name: str, file_name: str) -> Dict[str, Any]:
    """Load a resume from Supabase storage.
    
    Args:
        bucket_name (str): The name of the Supabase storage bucket
        file_name (str): The name of the resume file to download
        
    Returns:
        Dict[str, Any]: Dictionary with resume text and metadata.
    """
    temp_path = download_pdf_to_temp(bucket_name, file_name)
    
    if not temp_path:
        raise Exception(f"Failed to download resume {file_name} from bucket {bucket_name}")
    
    try:
        resume_id = Path(file_name).stem
        
        return {
            "id": resume_id,
            "filename": file_name,
            "content": extract_pdf_text(temp_path),
            "file_path": temp_path
        }
        
    except Exception as e:
        # Clean up temporary file on error
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        raise Exception(f"Error processing resume {file_name}: {e}")

def cleanup_temp_files(resumes: List[Dict[str, Any]]) -> None:
    """Clean up temporary files created during resume processing.
    
    Args:
        resumes (List[Dict[str, Any]]): List of resume dictionaries containing file paths
    """
    for resume in resumes:
        temp_path = resume.get("file_path")
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
                print(f"Cleaned up temporary file: {temp_path}")
            except Exception as e:
                print(f"Error cleaning up {temp_path}: {e}") 

def extract_pdf_text(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text