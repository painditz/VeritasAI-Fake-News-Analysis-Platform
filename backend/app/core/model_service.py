import os
import time
import logging
from typing import List, Dict, Tuple, Optional, Any
from collections import deque
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

from backend.app.core.config import settings
from backend.app.models.schemas import (
    ClassProbability,
    PredictionResponse,
    BatchPredictionResponse,
    ModelInfoResponse,
)

logger = logging.getLogger(__name__)

class ModelService:
    """
    Singleton service managing the fine-tuned BERT 6-class sequence classification model.
    Loads weights once at application startup. Supports CPU and optional CUDA inference.
    """
    _instance: Optional["ModelService"] = None

    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.device = None
        self.id2label: Dict[int, str] = {}
        self.label2id: Dict[str, int] = {}
        self.num_labels: int = 6
        self.is_loaded: bool = False
        self.start_time: float = time.time()
        
        # Analytics state
        self.total_predictions: int = 0
        self.total_latency_ms: float = 0.0
        self.label_distribution: Dict[str, int] = {}
        self.recent_predictions: deque = deque(maxlen=50)

    @classmethod
    def get_instance(cls) -> "ModelService":
        if cls._instance is None:
            cls._instance = ModelService()
        return cls._instance

    def load_model(self, model_path: Optional[str] = None):
        if self.is_loaded:
            logger.info("Model already loaded. Skipping duplicate initialization.")
            return

        target_path = model_path or settings.MODEL_PATH
        logger.info(f"Loading BERT model and tokenizer from: {target_path}")

        if not os.path.exists(target_path):
            raise FileNotFoundError(
                f"Model directory not found at: {target_path}. "
                "Ensure saved_model contains config.json and model.safetensors."
            )

        # Device selection: support CUDA if available and requested, default to CPU
        if settings.DEVICE.lower() == "cuda" and torch.cuda.is_available():
            self.device = torch.device("cuda")
        elif settings.DEVICE.lower() == "auto" and torch.cuda.is_available():
            self.device = torch.device("cuda")
        else:
            self.device = torch.device("cpu")

        logger.info(f"Target execution device: {self.device}")

        # Load tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(target_path)

        # Load model in eval mode
        self.model = AutoModelForSequenceClassification.from_pretrained(target_path)
        self.model.to(self.device)
        self.model.eval()

        # Parse labels safely (HuggingFace config can key by int or str)
        raw_id2label = self.model.config.id2label
        self.id2label = {int(k): str(v) for k, v in raw_id2label.items()}
        self.label2id = {v: k for k, v in self.id2label.items()}
        self.num_labels = len(self.id2label)

        # Initialize distribution counters
        self.label_distribution = {label: 0 for label in self.id2label.values()}
        self.is_loaded = True
        logger.info(
            f"Successfully loaded {self.model.config.architectures} with "
            f"{self.num_labels} classes: {list(self.label2id.keys())}"
        )

    def predict_single(
        self,
        statement: str,
        top_k: int = 3,
        include_evidence_obj: Optional[Any] = None
    ) -> PredictionResponse:
        if not self.is_loaded or self.model is None or self.tokenizer is None:
            raise RuntimeError("Model is not loaded. Call load_model() before making predictions.")

        clean_text = statement.strip()
        t0 = time.perf_counter()

        inputs = self.tokenizer(
            clean_text,
            return_tensors="pt",
            truncation=True,
            max_length=settings.MAX_SEQUENCE_LENGTH,
            padding=False,
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = self.model(**inputs)
            logits = outputs.logits
            probs_tensor = torch.softmax(logits, dim=-1)[0]

        latency_ms = (time.perf_counter() - t0) * 1000.0

        # Construct full 6-class probability dictionary
        probabilities: Dict[str, float] = {}
        for idx in range(self.num_labels):
            label_name = self.id2label[idx]
            probabilities[label_name] = round(float(probs_tensor[idx].item()), 4)

        # Rank classes descending
        sorted_indices = torch.argsort(probs_tensor, descending=True)
        ranked_probabilities: List[ClassProbability] = []
        for rank, idx_tensor in enumerate(sorted_indices, start=1):
            idx = int(idx_tensor.item())
            lbl = self.id2label[idx]
            prob_val = round(float(probs_tensor[idx].item()), 4)
            ranked_probabilities.append(
                ClassProbability(
                    label=lbl,
                    probability=prob_val,
                    percentage=round(prob_val * 100.0, 2),
                    rank=rank,
                )
            )

        top_three = ranked_probabilities[:top_k]
        predicted_label = ranked_probabilities[0].label
        confidence = ranked_probabilities[0].probability

        # Update analytics state
        self._record_analytics(clean_text, predicted_label, confidence, latency_ms)

        return PredictionResponse(
            statement=clean_text,
            predicted_label=predicted_label,
            confidence=confidence,
            probabilities=probabilities,
            ranked_probabilities=ranked_probabilities,
            top_three=top_three,
            inference_latency_ms=round(latency_ms, 2),
            device=str(self.device),
            disclaimer=settings.DISCLAIMER,
            evidence=include_evidence_obj,
        )

    def predict_batch(self, statements: List[str]) -> BatchPredictionResponse:
        if not self.is_loaded or self.model is None or self.tokenizer is None:
            raise RuntimeError("Model is not loaded.")

        clean_texts = [s.strip() for s in statements if s.strip()]
        if not clean_texts:
            return BatchPredictionResponse(
                total_items=0,
                predictions=[],
                batch_latency_ms=0.0,
                average_item_latency_ms=0.0,
            )

        t0 = time.perf_counter()
        predictions: List[PredictionResponse] = []

        # Process in batches to avoid CPU/GPU memory spikes
        batch_size = 16
        for i in range(0, len(clean_texts), batch_size):
            chunk = clean_texts[i : i + batch_size]
            inputs = self.tokenizer(
                chunk,
                return_tensors="pt",
                truncation=True,
                padding=True,
                max_length=settings.MAX_SEQUENCE_LENGTH,
            )
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits
                probs_batch = torch.softmax(logits, dim=-1)

            for text_idx, text in enumerate(chunk):
                p_tensor = probs_batch[text_idx]
                probabilities: Dict[str, float] = {}
                for idx in range(self.num_labels):
                    probabilities[self.id2label[idx]] = round(float(p_tensor[idx].item()), 4)

                sorted_indices = torch.argsort(p_tensor, descending=True)
                ranked: List[ClassProbability] = []
                for rank, idx_tensor in enumerate(sorted_indices, start=1):
                    idx = int(idx_tensor.item())
                    lbl = self.id2label[idx]
                    prob_val = round(float(p_tensor[idx].item()), 4)
                    ranked.append(
                        ClassProbability(
                            label=lbl,
                            probability=prob_val,
                            percentage=round(prob_val * 100.0, 2),
                            rank=rank,
                        )
                    )

                top_3 = ranked[:3]
                best_label = ranked[0].label
                best_conf = ranked[0].probability

                # Single item proxy latency
                item_lat = round(((time.perf_counter() - t0) * 1000.0) / len(clean_texts), 2)
                self._record_analytics(text, best_label, best_conf, item_lat)

                predictions.append(
                    PredictionResponse(
                        statement=text,
                        predicted_label=best_label,
                        confidence=best_conf,
                        probabilities=probabilities,
                        ranked_probabilities=ranked,
                        top_three=top_3,
                        inference_latency_ms=item_lat,
                        device=str(self.device),
                        disclaimer=settings.DISCLAIMER,
                        evidence=None,
                    )
                )

        batch_latency = (time.perf_counter() - t0) * 1000.0
        avg_item_lat = batch_latency / len(clean_texts) if clean_texts else 0.0

        return BatchPredictionResponse(
            total_items=len(predictions),
            predictions=predictions,
            batch_latency_ms=round(batch_latency, 2),
            average_item_latency_ms=round(avg_item_lat, 2),
        )

    def _record_analytics(self, statement: str, label: str, confidence: float, latency_ms: float):
        self.total_predictions += 1
        self.total_latency_ms += latency_ms
        self.label_distribution[label] = self.label_distribution.get(label, 0) + 1
        self.recent_predictions.appendleft(
            {
                "statement": statement[:120] + ("..." if len(statement) > 120 else ""),
                "predicted_label": label,
                "confidence": confidence,
                "latency_ms": round(latency_ms, 2),
                "timestamp": time.time(),
            }
        )

    def get_model_info(self) -> ModelInfoResponse:
        if not self.is_loaded or self.model is None:
            raise RuntimeError("Model is not loaded.")

        total_params = sum(p.numel() for p in self.model.parameters())
        id2label_str = {str(k): v for k, v in self.id2label.items()}

        return ModelInfoResponse(
            architecture=self.model.config.architectures[0] if self.model.config.architectures else "BertForSequenceClassification",
            base_model="bert-base-uncased",
            num_classes=self.num_labels,
            labels=[self.id2label[i] for i in range(self.num_labels)],
            id2label=id2label_str,
            label2id=self.label2id,
            max_position_embeddings=self.model.config.max_position_embeddings,
            configured_sequence_length=settings.MAX_SEQUENCE_LENGTH,
            device=str(self.device),
            model_path=str(settings.MODEL_PATH),
            vocab_size=self.model.config.vocab_size,
            total_parameters=total_params,
            dataset_info={
                "name": "LIAR Benchmark",
                "source": "tasksource/liar",
                "classes": [
                    {"label": "false", "meaning": "Completely false statement with no factual basis"},
                    {"label": "half-true", "meaning": "Partially accurate but leaves out key facts or takes things out of context"},
                    {"label": "mostly-true", "meaning": "Accurate overall but needs clarification or additional information"},
                    {"label": "true", "meaning": "Accurate and verified; no significant omissions or distortions"},
                    {"label": "barely-true", "meaning": "Contains an element of truth but ignores critical context"},
                    {"label": "pants-fire", "meaning": "Egregiously false claim; ridiculous, reckless or conspiratorial"},
                ],
                "task": "Fine-grained 6-way political claim truthfulness classification",
            },
        )

    def get_analytics(self) -> Dict[str, Any]:
        avg_lat = (
            round(self.total_latency_ms / self.total_predictions, 2)
            if self.total_predictions > 0
            else 0.0
        )
        return {
            "total_predictions": self.total_predictions,
            "label_distribution": self.label_distribution,
            "average_latency_ms": avg_lat,
            "recent_predictions": list(self.recent_predictions),
        }
