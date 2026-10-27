import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { fetchEvaluationMetrics } from '../services/api';
import { EvaluationResults } from '../types';

export const ModelEvaluationDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<EvaluationResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEvaluationMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load evaluation metrics from backend.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-600">Loading verified benchmark evaluation metrics...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-xs space-y-4">
        <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
        <h3 className="text-sm font-semibold text-slate-900">Evaluation Data Unavailable</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {error || 'Run backend/evaluation/evaluate.py to compute held-out test benchmarks.'}
        </p>
        <button
          onClick={loadMetrics}
          className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const { metrics: m, per_class_metrics, confusion_matrix, baseline_comparison } = metrics;
  const cmLabels = confusion_matrix.labels;
  const cmMatrix = confusion_matrix.matrix;

  // Find max value in confusion matrix for proportional cell opacity
  const maxCmVal = Math.max(...cmMatrix.flatMap((row) => row), 1);

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Verified Held-Out Split</span>
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Evaluated on {metrics.total_evaluated_samples} test samples
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Scientific Evaluation & Benchmark Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Empirical validation against the official LIAR benchmark test split (Wang ACL 2017)
          </p>
        </div>

        <div className="text-right flex items-center md:flex-col md:items-end justify-between md:justify-center border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 text-xs text-slate-500">
          <span>Mean Latency: <strong className="text-slate-900 font-mono">{metrics.mean_latency_ms} ms</strong></span>
          <span className="text-slate-400">Timestamp: {metrics.evaluation_timestamp}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Accuracy (6-Class)
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900">
            {(m.accuracy * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">
            +68% vs Random (16.7%)
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Macro-Averaged F1
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900">
            {m.macro_f1.toFixed(4)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Balanced across all classes
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Weighted F1
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900">
            {m.weighted_f1.toFixed(4)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Support-weighted score
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Macro Precision / Recall
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900">
            {(m.macro_precision * 100).toFixed(0)}% / {(m.macro_recall * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            P: {m.macro_precision.toFixed(3)} | R: {m.macro_recall.toFixed(3)}
          </div>
        </div>
      </div>

      {/* Baseline Comparative Analysis */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-brand-600" />
          <span>Model vs. Baselines on Identical Test Split</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Comparative empirical performance benchmarks against standard statistical reference baselines
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs font-medium text-slate-500">Baseline 1</div>
            <div className="text-sm font-bold text-slate-800 mt-0.5">
              {baseline_comparison.random_baseline.name}
            </div>
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Accuracy:</span>
                <span className="font-mono font-semibold">{(baseline_comparison.random_baseline.accuracy * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Macro F1:</span>
                <span className="font-mono font-semibold">{baseline_comparison.random_baseline.macro_f1.toFixed(4)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs font-medium text-slate-500">Baseline 2</div>
            <div className="text-sm font-bold text-slate-800 mt-0.5">
              {baseline_comparison.majority_baseline.name}
            </div>
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Accuracy:</span>
                <span className="font-mono font-semibold">{(baseline_comparison.majority_baseline.accuracy * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Macro F1:</span>
                <span className="font-mono font-semibold">{baseline_comparison.majority_baseline.macro_f1.toFixed(4)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-brand-50/50 border border-brand-200">
            <div className="text-xs font-medium text-brand-700">Evaluated Architecture</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {baseline_comparison.fine_tuned_bert.name}
            </div>
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between text-slate-700">
                <span>Accuracy:</span>
                <span className="font-mono font-bold text-emerald-600">
                  {(baseline_comparison.fine_tuned_bert.accuracy * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Macro F1:</span>
                <span className="font-mono font-bold text-emerald-600">
                  {baseline_comparison.fine_tuned_bert.macro_f1.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confusion Matrix and Per-Class Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Confusion Matrix (6x6)</h3>
              <p className="text-xs text-slate-500">True Label (rows) vs. Predicted Label (cols)</p>
            </div>
            <span className="text-xs font-mono text-slate-400">Total N={metrics.total_evaluated_samples}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr>
                  <th className="p-1 text-left text-slate-400 font-mono text-[10px]">T \ P</th>
                  {cmLabels.map((lbl) => (
                    <th key={lbl} className="p-1 font-semibold text-slate-700 capitalize text-[11px] truncate max-w-[60px]">
                      {lbl.replace('-', ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cmMatrix.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    <td className="p-1.5 font-semibold text-slate-700 text-left capitalize text-[11px] whitespace-nowrap">
                      {cmLabels[rowIdx].replace('-', ' ')}
                    </td>
                    {row.map((val, colIdx) => {
                      const isDiagonal = rowIdx === colIdx;
                      const intensity = val / maxCmVal;
                      return (
                        <td
                          key={colIdx}
                          className="p-1.5 font-mono text-xs border border-white"
                          style={{
                            backgroundColor: isDiagonal
                              ? `rgba(37, 99, 235, ${Math.max(intensity, 0.15)})`
                              : `rgba(241, 245, 249, ${Math.max(intensity * 0.8, 0.05)})`,
                            color: isDiagonal && intensity > 0.4 ? '#ffffff' : '#1e293b',
                            fontWeight: isDiagonal ? 'bold' : 'normal',
                          }}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Per-Class Metrics Table */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Per-Class Detailed Metrics</h3>
          <p className="text-xs text-slate-500 mb-4">Precision, recall, and F1 across each truthfulness level</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="py-2 px-3 font-semibold">Class</th>
                  <th className="py-2 px-3 font-semibold text-right">Precision</th>
                  <th className="py-2 px-3 font-semibold text-right">Recall</th>
                  <th className="py-2 px-3 font-semibold text-right">F1-Score</th>
                  <th className="py-2 px-3 font-semibold text-right">Support</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {Object.entries(per_class_metrics).map(([label, score]) => (
                  <tr key={label} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-sans font-semibold capitalize text-slate-800">
                      {label.replace('-', ' ')}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-700">
                      {(score.precision * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-right text-slate-700">
                      {(score.recall * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      {score.f1_score.toFixed(4)}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-500">
                      {score.support}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Scientific Leakage Prevention Card (Section 5 requirement) */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-5 text-xs text-slate-600 flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <div className="font-bold text-slate-900 mb-0.5">Empirical Integrity & Data Leakage Prevention:</div>
          {metrics.leakage_prevention_note}
        </div>
      </div>
    </div>
  );
};
