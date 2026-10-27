export type LiarLabel = 
  | 'true'
  | 'mostly-true'
  | 'half-true'
  | 'barely-true'
  | 'false'
  | 'pants-fire';

export interface ClassProbability {
  label: LiarLabel;
  probability: number;
  percentage: number;
  rank: number;
}

export interface EvidenceItem {
  title: string;
  url?: string;
  source: string;
  snippet: string;
  published_date?: string;
  relevance_score: number;
  alignment_category: 'supporting' | 'conflicting' | 'neutral_context';
}

export interface EvidenceResponse {
  query: string;
  retrieval_method: string;
  items: EvidenceItem[];
  retrieval_summary: string;
  distinction_note: string;
}

export interface PredictionResponse {
  statement: string;
  predicted_label: LiarLabel;
  confidence: number;
  probabilities: Record<string, number>;
  ranked_probabilities: ClassProbability[];
  top_three: ClassProbability[];
  inference_latency_ms: number;
  device: string;
  disclaimer: string;
  evidence?: EvidenceResponse | null;
  id?: string;
  timestamp?: number;
}

export interface BatchPredictionResponse {
  total_items: number;
  predictions: PredictionResponse[];
  batch_latency_ms: number;
  average_item_latency_ms: number;
}

export interface ModelInfoResponse {
  architecture: string;
  base_model: string;
  num_classes: number;
  labels: string[];
  id2label: Record<string, string>;
  label2id: Record<string, number>;
  max_position_embeddings: number;
  configured_sequence_length: number;
  device: string;
  model_path: string;
  vocab_size: number;
  total_parameters: number;
  dataset_info: {
    name: string;
    source: string;
    classes: Array<{ label: string; meaning: string }>;
    task: string;
  };
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  device: string;
  app_version: string;
  uptime_seconds: number;
  memory_info: {
    rss_mb: number;
    vms_mb: number;
    cpu_percent: number;
  };
}

export interface AnalyticsResponse {
  total_predictions: number;
  label_distribution: Record<string, number>;
  average_latency_ms: number;
  recent_predictions: Array<{
    statement: string;
    predicted_label: string;
    confidence: number;
    latency_ms: number;
    timestamp: number;
  }>;
}

export interface EvaluationResults {
  dataset: string;
  evaluation_timestamp: string;
  total_evaluated_samples: number;
  device: string;
  mean_latency_ms: number;
  total_eval_time_seconds: number;
  metrics: {
    accuracy: number;
    macro_f1: number;
    macro_precision: number;
    macro_recall: number;
    weighted_f1: number;
    weighted_precision: number;
    weighted_recall: number;
  };
  per_class_metrics: Record<
    string,
    {
      precision: number;
      recall: number;
      f1_score: number;
      support: number;
    }
  >;
  confusion_matrix: {
    labels: string[];
    matrix: number[][];
  };
  baseline_comparison: {
    random_baseline: {
      name: string;
      accuracy: number;
      macro_f1: number;
    };
    majority_baseline: {
      name: string;
      accuracy: number;
      macro_f1: number;
    };
    fine_tuned_bert: {
      name: string;
      accuracy: number;
      macro_f1: number;
      weighted_f1: number;
    };
  };
  leakage_prevention_note: string;
}
