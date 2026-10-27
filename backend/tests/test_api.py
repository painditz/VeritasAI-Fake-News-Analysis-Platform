import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.model_service import ModelService

@pytest.fixture(scope="session", autouse=True)
def client():
    # Use lifespan context manager so startup event runs and model is loaded
    with TestClient(app) as c:
        yield c

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert "VeritasAI" in data["service"]

def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "initializing"]
    assert "device" in data
    assert "memory_info" in data

def test_model_info_endpoint(client):
    response = client.get("/api/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["architecture"] == "BertForSequenceClassification"
    assert data["num_classes"] == 6
    assert len(data["labels"]) == 6
    assert "false" in data["labels"]
    assert "pants-fire" in data["labels"]

def test_predict_validation_error(client):
    # Statement too short
    response = client.post("/api/predict", json={"statement": "a"})
    assert response.status_code == 422

    # Empty statement
    response = client.post("/api/predict", json={"statement": ""})
    assert response.status_code == 422

def test_predict_valid_claim(client):
    claim = "Scientists have discovered evidence of water ice on Mars."
    response = client.post(
        "/api/predict",
        json={"statement": claim, "include_evidence": False}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["statement"] == claim
    assert data["predicted_label"] in ["false", "half-true", "mostly-true", "true", "barely-true", "pants-fire"]
    assert len(data["probabilities"]) == 6
    assert len(data["top_three"]) == 3
    assert data["inference_latency_ms"] > 0
    assert "statistical note" in data["disclaimer"].lower()

def test_predict_with_evidence(client):
    claim = "Official monthly civilian unemployment rates tracked across presidential administrations."
    response = client.post(
        "/api/predict",
        json={"statement": claim, "include_evidence": True}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["evidence"] is not None
    assert len(data["evidence"]["items"]) > 0

def test_batch_predict(client):
    statements = [
        "The economy grew by 3 percent last quarter.",
        "New energy subsidies will lower household utility bills.",
    ]
    response = client.post(
        "/api/predict/batch",
        json={"statements": statements}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_items"] == 2
    assert len(data["predictions"]) == 2
    assert data["batch_latency_ms"] > 0

def test_analytics_endpoint(client):
    response = client.get("/api/analytics")
    assert response.status_code == 200
    data = response.json()
    assert "total_predictions" in data
    assert "label_distribution" in data
    assert "average_latency_ms" in data

def test_evaluation_endpoint(client):
    response = client.get("/api/evaluation")
    assert response.status_code == 200
    data = response.json()
    assert data["dataset"] == "LIAR Benchmark (Held-out test split)"
    assert "metrics" in data
    assert "accuracy" in data["metrics"]
    assert "confusion_matrix" in data
