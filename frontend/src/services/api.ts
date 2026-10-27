import {
  PredictionResponse,
  BatchPredictionResponse,
  ModelInfoResponse,
  HealthResponse,
  AnalyticsResponse,
  EvaluationResults,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function analyzeClaim(
  statement: string,
  includeEvidence: boolean = false,
  context?: string
): Promise<PredictionResponse> {
  const res = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      statement,
      include_evidence: includeEvidence,
      context,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export async function analyzeBatchClaims(
  statements: string[],
  includeEvidence: boolean = false
): Promise<BatchPredictionResponse> {
  const res = await fetch(`${API_BASE_URL}/predict/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      statements,
      include_evidence: includeEvidence,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Batch request failed with status ${res.status}`);
  }

  return res.json();
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchModelInfo(): Promise<ModelInfoResponse> {
  const res = await fetch(`${API_BASE_URL}/model-info`);
  if (!res.ok) throw new Error('Failed to retrieve model info');
  return res.json();
}

export async function fetchAnalytics(): Promise<AnalyticsResponse> {
  const res = await fetch(`${API_BASE_URL}/analytics`);
  if (!res.ok) throw new Error('Failed to retrieve analytics');
  return res.json();
}

export async function fetchEvaluationMetrics(): Promise<EvaluationResults> {
  const res = await fetch(`${API_BASE_URL}/evaluation`);
  if (!res.ok) throw new Error('Failed to load evaluation metrics');
  return res.json();
}
