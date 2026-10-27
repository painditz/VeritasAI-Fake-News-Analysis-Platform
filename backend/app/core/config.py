import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "VeritasAI - Advanced Fake News Analysis Engine"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Path to the fine-tuned BERT model directory
    # Searches relative to project root or workspace
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent.parent
    MODEL_PATH: str = os.getenv("MODEL_PATH", str(BASE_DIR / "saved_model"))
    
    # Device selection: "auto", "cpu", or "cuda"
    DEVICE: str = os.getenv("DEVICE", "auto")
    
    # Inference parameters
    MAX_SEQUENCE_LENGTH: int = int(os.getenv("MAX_SEQUENCE_LENGTH", "128"))
    DEFAULT_TOP_K: int = 3
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"]
    
    # Evidence Retrieval settings
    ENABLE_EXTERNAL_SEARCH: bool = True
    SEARCH_TIMEOUT_SECONDS: float = 4.0
    
    # Explanation disclaimer
    DISCLAIMER: str = (
        "Statistical Note: Output probabilities are model-estimated likelihoods computed from the fine-tuned "
        "BERT architecture trained on the LIAR political fact-checking benchmark. They reflect text-pattern "
        "correlations rather than objective, definitive proof of factual truth."
    )

    model_config = {
        "env_file": ".env",
        "extra": "allow",
    }

settings = Settings()
