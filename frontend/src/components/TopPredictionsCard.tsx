import React from 'react';
import { Award, Clock, Cpu } from 'lucide-react';
import { PredictionResponse } from '../types';

interface TopPredictionsCardProps {
  prediction: PredictionResponse;
}

const BADGE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  true: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'mostly-true': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'half-true': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'barely-true': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  false: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'pants-fire': { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
};

export const TopPredictionsCard: React.FC<TopPredictionsCardProps> = ({ prediction }) => {
  const topCandidate = prediction.top_three[0];
  const badgeStyle = BADGE_STYLES[topCandidate.label] || {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
              Primary Prediction & Top Candidates
            </h3>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{prediction.inference_latency_ms} ms</span>
          </div>
        </div>

        {/* Primary Classification Callout */}
        <div className={`p-4 rounded-lg border ${badgeStyle.bg} ${badgeStyle.border} mb-5`}>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Highest Probability Class
          </div>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-bold capitalize ${badgeStyle.text}`}>
              {topCandidate.label.replace('-', ' ')}
            </span>
            <span className="text-2xl font-extrabold font-mono text-slate-900">
              {topCandidate.percentage.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-slate-600 mt-2">
            Model confidence: {(topCandidate.probability).toFixed(4)} out of 1.0000
          </div>
        </div>

        {/* Top 3 Ranked Candidates */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Top 3 Ranked Classes
          </div>
          {prediction.top_three.map((item, idx) => (
            <div key={item.label} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-white border border-slate-200 font-mono text-xs flex items-center justify-center font-bold text-slate-700">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {item.label.replace('-', ' ')}
                  </span>
                </div>
                <span className="font-mono font-medium text-slate-700">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-slate-700 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Latency & Device Footer */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-1.5">
          <Cpu className="w-3.5 h-3.5 text-slate-400" />
          <span>Device: {prediction.device}</span>
        </div>
        <span className="text-slate-400 font-mono">128 tokens max</span>
      </div>
    </div>
  );
};
