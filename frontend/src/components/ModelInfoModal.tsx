import React from 'react';
import { X, Cpu, Layers, BookOpen } from 'lucide-react';
import { ModelInfoResponse } from '../types';

interface ModelInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelInfo: ModelInfoResponse | null;
}

export const ModelInfoModal: React.FC<ModelInfoModalProps> = ({
  isOpen,
  onClose,
  modelInfo,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">
              BERT Model & Dataset Architecture
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-slate-600 max-h-[75vh] overflow-y-auto">
          {modelInfo ? (
            <>
              {/* Architecture specs */}
              <div>
                <h4 className="font-semibold text-slate-900 text-sm mb-2 flex items-center space-x-1.5">
                  <Layers className="w-4 h-4 text-brand-600" />
                  <span>Model Specifications</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Base Model</span>
                    <span className="font-mono font-medium text-slate-800">{modelInfo.base_model}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Parameters</span>
                    <span className="font-mono font-medium text-slate-800">
                      {(modelInfo.total_parameters / 1e6).toFixed(1)} Million
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Vocab Size</span>
                    <span className="font-mono font-medium text-slate-800">{modelInfo.vocab_size} tokens</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Max Embeddings</span>
                    <span className="font-mono font-medium text-slate-800">{modelInfo.max_position_embeddings} pos</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Sequence Length</span>
                    <span className="font-mono font-medium text-slate-800">{modelInfo.configured_sequence_length} tokens</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Target Device</span>
                    <span className="font-mono font-medium text-slate-800 capitalize">{modelInfo.device}</span>
                  </div>
                </div>
              </div>

              {/* Dataset & Label Mapping */}
              <div>
                <h4 className="font-semibold text-slate-900 text-sm mb-2 flex items-center space-x-1.5">
                  <BookOpen className="w-4 h-4 text-brand-600" />
                  <span>LIAR Benchmark 6-Way Truthfulness Ontology</span>
                </h4>
                <div className="space-y-2">
                  {modelInfo.dataset_info.classes.map((c) => (
                    <div
                      key={c.label}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-start space-x-2.5"
                    >
                      <span className="font-mono font-bold text-slate-800 capitalize shrink-0 w-24">
                        {c.label.replace('-', ' ')}:
                      </span>
                      <span className="text-slate-600 leading-normal">{c.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Local Storage & Weights note */}
              <div className="p-3 bg-slate-100 rounded-lg text-slate-500 font-mono text-[11px] truncate">
                Weights loaded from: {modelInfo.model_path}
              </div>
            </>
          ) : (
            <p>Loading model specifications...</p>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
