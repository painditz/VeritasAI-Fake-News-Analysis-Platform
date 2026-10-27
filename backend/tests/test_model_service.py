import pytest
import os
import torch
from backend.app.core.model_service import ModelService
from backend.app.core.evidence_service import EvidenceService

def test_model_service_singleton_loading():
    service = ModelService.get_instance()
    assert service is not None
    service.load_model()
    assert service.is_loaded is True
    assert service.model is not None
    assert service.tokenizer is not None
    assert service.num_labels == 6

def test_label_mappings():
    service = ModelService.get_instance()
    service.load_model()
    # Check that all 6 LIAR labels exist in mapping
    expected_labels = {"false", "half-true", "mostly-true", "true", "barely-true", "pants-fire"}
    actual_labels = set(service.label2id.keys())
    assert actual_labels == expected_labels
    for idx, name in service.id2label.items():
        assert service.label2id[name] == idx

def test_predict_single_probabilities():
    service = ModelService.get_instance()
    service.load_model()
    claim = "The state budget includes no new taxes for working families."
    response = service.predict_single(claim, top_k=3)
    
    assert response.statement == claim
    assert response.predicted_label in service.label2id
    assert 0.0 <= response.confidence <= 1.0
    assert len(response.probabilities) == 6
    assert len(response.top_three) == 3
    # Check sum of probabilities close to 1.0
    prob_sum = sum(response.probabilities.values())
    assert 0.99 <= prob_sum <= 1.01
    assert response.inference_latency_ms > 0
    assert "LIAR" in response.disclaimer

def test_evidence_service_retrieval():
    claim = "Says the unemployment rate has been cut in half since he took office."
    evidence_resp = EvidenceService.retrieve_evidence(claim)
    assert evidence_resp is not None
    assert len(evidence_resp.items) > 0
    first_item = evidence_resp.items[0]
    assert first_item.title
    assert first_item.snippet
    assert first_item.source
    assert first_item.alignment_category in {"supporting", "conflicting", "neutral_context"}
    assert "DISTINCTION" in evidence_resp.distinction_note
