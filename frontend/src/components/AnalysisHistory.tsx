import React from 'react';
import { History, ArrowRight, Trash2 } from 'lucide-react';
import { PredictionResponse } from '../types';

interface AnalysisHistoryProps {
  history: PredictionResponse[];
  onSelectPrediction: (prediction: PredictionResponse) => void;
  onClearHistory: () => void;
}

export const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({
  history,
  onSelectPrediction,
  onClearHistory,
}) => {
  if (history.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">Recent Session Claims</h3>
        </div>
        <button
          onClick={onClearHistory}
          className="text-xs text-slate-400 hover:text-rose-600 transition-colors flex items-center space-x-1"
          title="Clear History"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
        {history.map((item, idx) => (
          <div
            key={item.id || idx}
            onClick={() => onSelectPrediction(item)}
            className="p-2.5 rounded-lg border border-slate-100 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-100/50 transition-all cursor-pointer flex items-center justify-between text-xs group"
          >
            <div className="min-w-0 pr-3">
              <p className="font-medium text-slate-800 truncate">{item.statement}</p>
              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-2">
                <span>Confidence: {(item.confidence * 100).toFixed(1)}%</span>
                <span>•</span>
                <span>{item.inference_latency_ms} ms</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="capitalize font-semibold px-2 py-0.5 rounded text-[11px] bg-white text-slate-700 border border-slate-200">
                {item.predicted_label.replace('-', ' ')}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
