import time
import psutil
from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional

from backend.app.models.schemas import (
    PredictionRequest,
    PredictionResponse,
    BatchPredictionRequest,
    BatchPredictionResponse,
    ModelInfoResponse,
    HealthResponse,
    AnalyticsResponse,
)
from backend.app.core.model_service import ModelService
from backend.app.core.evidence_service import EvidenceService
from backend.app.core.config import settings

router = APIRouter()
model_service = ModelService.get_instance()

@router.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Analyze news claim with BERT 6-class classifier",
    description="Calculates probabilities across all six truthfulness labels from the LIAR dataset spectrum.",
)
async def predict_claim(request: PredictionRequest):
    if not request.statement or len(request.statement.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Statement text must contain at least 3 non-whitespace characters."
        )

    # Optional evidence retrieval
    evidence_data = None
    if request.include_evidence:
        evidence_data = EvidenceService.retrieve_evidence(request.statement)

    try:
        response = model_service.predict_single(
            statement=request.statement,
            top_k=settings.DEFAULT_TOP_K,
            include_evidence_obj=evidence_data,
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}"
        )

@router.post(
    "/predict/batch",
    response_model=BatchPredictionResponse,
    summary="Batch claim analysis",
    description="Processes up to 200 statements in memory-efficient batches.",
)
async def predict_claims_batch(request: BatchPredictionRequest):
    if not request.statements:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Batch list of statements cannot be empty."
        )
    if len(request.statements) > 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Batch exceeds maximum limit of 200 items per request."
        )

    try:
        return model_service.predict_batch(request.statements)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch inference error: {str(e)}"
        )

@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Service health and hardware status",
)
async def health_check():
    process = psutil.Process()
    mem_info = process.memory_info()
    uptime = time.time() - model_service.start_time

    return HealthResponse(
        status="healthy" if model_service.is_loaded else "initializing",
        model_loaded=model_service.is_loaded,
        device=str(model_service.device),
        app_version=settings.VERSION,
        uptime_seconds=round(uptime, 2),
        memory_info={
            "rss_mb": round(mem_info.rss / (1024 * 1024), 2),
            "vms_mb": round(mem_info.vms / (1024 * 1024), 2),
            "cpu_percent": process.cpu_percent(interval=None),
        },
    )

@router.get(
    "/model-info",
    response_model=ModelInfoResponse,
    summary="Model metadata and label specification",
)
async def get_model_info():
    if not model_service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is still loading into memory. Please retry momentarily."
        )
    return model_service.get_model_info()

@router.get(
    "/analytics",
    response_model=AnalyticsResponse,
    summary="Real-time inference analytics and request distributions",
)
async def get_analytics():
    data = model_service.get_analytics()
    return AnalyticsResponse(
        total_predictions=data["total_predictions"],
        label_distribution=data["label_distribution"],
        average_latency_ms=data["average_latency_ms"],
        recent_predictions=data["recent_predictions"],
    )

@router.get(
    "/evaluation",
    summary="Get verified benchmark evaluation metrics and confusion matrix",
    description="Returns held-out test evaluation results, per-class metrics, confusion matrix, and baseline comparisons.",
)
async def get_evaluation_metrics():
    import json
    from pathlib import Path
    eval_file = Path("backend/evaluation/evaluation_results.json")
    if not eval_file.exists():
        eval_file = Path(__file__).resolve().parent.parent.parent / "evaluation" / "evaluation_results.json"
    
    if eval_file.exists():
        with open(eval_file, "r", encoding="utf-8") as f:
            return json.load(f)
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Evaluation metrics not found. Run evaluate.py first."
    )
