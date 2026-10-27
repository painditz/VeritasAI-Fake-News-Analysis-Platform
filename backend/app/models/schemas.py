from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class PredictionRequest(BaseModel):
    statement: str = Field(..., min_length=3, max_length=5000, description="The news claim or statement to analyze")
    include_evidence: bool = Field(False, description="Whether to perform multi-source evidence document retrieval")
    context: Optional[str] = Field(None, max_length=1000, description="Optional metadata or context (e.g. speaker, source)")

class ClassProbability(BaseModel):
    label: str
    probability: float
    percentage: float
    rank: int

class EvidenceItem(BaseModel):
    title: str
    url: Optional[str] = None
    source: str
    snippet: str
    published_date: Optional[str] = None
    relevance_score: float
    alignment_category: str = Field(..., description="Categorization: supporting, conflicting, or context")

class EvidenceResponse(BaseModel):
    query: str
    retrieval_method: str
    items: List[EvidenceItem]
    retrieval_summary: str
    distinction_note: str = (
        "IMPORTANT DISTINCTION: This evidence section represents external/local document retrieval snippets. "
        "It is strictly independent of BERT's statistical feature-weight classification. "
        "Claims should be evaluated by cross-referencing primary source context, not by automated scores alone."
    )

class PredictionResponse(BaseModel):
    statement: str
    predicted_label: str
    confidence: float
    probabilities: Dict[str, float]
    ranked_probabilities: List[ClassProbability]
    top_three: List[ClassProbability]
    inference_latency_ms: float
    device: str
    disclaimer: str
    evidence: Optional[EvidenceResponse] = None

class BatchPredictionRequest(BaseModel):
    statements: List[str] = Field(..., min_length=1, max_length=200, description="List of statements to analyze in batch")
    include_evidence: bool = Field(False, description="Whether to include evidence retrieval (disabled by default for batch speed)")

class BatchPredictionResponse(BaseModel):
    total_items: int
    predictions: List[PredictionResponse]
    batch_latency_ms: float
    average_item_latency_ms: float

class ModelInfoResponse(BaseModel):
    architecture: str
    base_model: str
    num_classes: int
    labels: List[str]
    id2label: Dict[str, str]
    label2id: Dict[str, int]
    max_position_embeddings: int
    configured_sequence_length: int
    device: str
    model_path: str
    vocab_size: int
    total_parameters: int
    dataset_info: Dict[str, Any]

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    device: str
    app_version: str
    uptime_seconds: float
    memory_info: Dict[str, Any]

class AnalyticsResponse(BaseModel):
    total_predictions: int
    label_distribution: Dict[str, int]
    average_latency_ms: float
    recent_predictions: List[Dict[str, Any]]
