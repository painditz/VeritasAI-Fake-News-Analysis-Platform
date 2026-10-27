import React, { useState } from 'react';
import { Send, RotateCcw, Sparkles, AlertCircle, Info } from 'lucide-react';
import { PredictionResponse } from '../types';
import { analyzeClaim } from '../services/api';
import { SixClassProbabilityChart } from './SixClassProbabilityChart';
import { TopPredictionsCard } from './TopPredictionsCard';
import { EvidenceVerificationCard } from './EvidenceVerificationCard';

interface ClaimAnalysisWorkspaceProps {
  onPredictionComplete: (prediction: PredictionResponse) => void;
  activePrediction: PredictionResponse | null;
}

const BENCHMARK_PRESETS = [
  {
    title: 'Economic & Labor',
    claim: 'Says the unemployment rate has been cut in half since he took office.',
  },
  {
    title: 'Fiscal & Taxes',
    claim: 'The state budget includes no new taxes for working families.',
  },
  {
    title: 'Scientific Announcement',
    claim: 'Astronomers and NASA scientists have discovered a potentially habitable exoplanet.',
  },
  {
    title: 'Public Health',
    claim: 'Peer-reviewed studies prove the virus was created in a secret laboratory.',
  },
];

export const ClaimAnalysisWorkspace: React.FC<ClaimAnalysisWorkspaceProps> = ({
  onPredictionComplete,
  activePrediction,
}) => {
  const [statement, setStatement] = useState(
    activePrediction?.statement || 'Says the unemployment rate has been cut in half since he took office.'
  );
  const [includeEvidence, setIncludeEvidence] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statement.trim() || statement.trim().length < 3) {
      setError('Please provide a claim of at least 3 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await analyzeClaim(statement.trim(), includeEvidence);
      onPredictionComplete({
        ...result,
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred while connecting to VeritasAI backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (presetClaim: string) => {
    setStatement(presetClaim);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">
              News Claim Analysis Workspace
            </h2>
            <p className="text-xs text-slate-500">
              Enter any statement or political claim to analyze across 6 LIAR truthfulness categories
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center space-x-1.5 flex-wrap">
            <span className="text-xs text-slate-400 mr-1 flex items-center">
              <Sparkles className="w-3 h-3 mr-1 text-slate-400" /> Samples:
            </span>
            {BENCHMARK_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(p.claim)}
                className="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              rows={4}
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="e.g. 'Says the unemployment rate has been cut in half since he took office.'"
              className="w-full rounded-lg border border-slate-300 p-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-sans resize-y"
              disabled={loading}
            />
            <div className="absolute right-3 bottom-3 text-xs text-slate-400 font-mono">
              {statement.length} chars
            </div>
          </div>

          {/* Options & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <label className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeEvidence}
                onChange={(e) => setIncludeEvidence(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4"
              />
              <span className="font-medium">Perform evidence document retrieval & source fact-checking</span>
            </label>

            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={() => setStatement('')}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 flex items-center space-x-1"
                disabled={loading || !statement}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>

              <button
                type="submit"
                disabled={loading || !statement.trim()}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 rounded-lg shadow-xs transition-all flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing BERT Embeddings...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Run Truthfulness Analysis</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Analysis Error: </span>
              {error}
            </div>
          </div>
        )}
      </div>

      {/* Analysis Results Display */}
      {activePrediction && (
        <div className="space-y-6">
          {/* Top Row: Probabilities Chart and Top Predictions Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SixClassProbabilityChart
                probabilities={activePrediction.probabilities}
                rankedProbabilities={activePrediction.ranked_probabilities}
              />
            </div>
            <div className="lg:col-span-1">
              <TopPredictionsCard prediction={activePrediction} />
            </div>
          </div>

          {/* Evidence Retrieval Module (Section 4) */}
          {activePrediction.evidence && (
            <EvidenceVerificationCard evidence={activePrediction.evidence} />
          )}

          {/* Statistical Disclaimer Banner (Section 2 & 4) */}
          <div className="bg-slate-100/80 border border-slate-200 rounded-lg p-4 text-xs text-slate-600 flex items-start space-x-3">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-slate-800">Methodological Disclosure: </span>
              {activePrediction.disclaimer}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
