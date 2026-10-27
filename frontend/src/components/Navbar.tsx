import React from 'react';
import { ShieldCheck, Activity, FileSpreadsheet, BarChart3, HelpCircle } from 'lucide-react';
import { HealthResponse } from '../types';

interface NavbarProps {
  activeTab: 'workspace' | 'evaluation' | 'batch';
  setActiveTab: (tab: 'workspace' | 'evaluation' | 'batch') => void;
  health: HealthResponse | null;
  onOpenModelInfo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  health,
  onOpenModelInfo,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6 text-brand-500" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">VeritasAI</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  BERT 6-Class
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                LIAR Benchmark Truthfulness & Evidence Intelligence
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'workspace'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Claim Analysis</span>
            </button>
            <button
              onClick={() => setActiveTab('evaluation')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'evaluation'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Evaluation & Metrics</span>
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'batch'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Batch CSV</span>
            </button>
          </nav>

          {/* Hardware & Model Info Status */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
              <span
                className={`w-2 h-2 rounded-full ${
                  health?.status === 'healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="font-medium capitalize">{health?.device || 'CPU'}</span>
              <span className="text-slate-300">|</span>
              <span>{health ? `${health.memory_info.rss_mb} MB RSS` : 'Loading...'}</span>
            </div>

            <button
              onClick={onOpenModelInfo}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
              title="View Model Configuration & Dataset Info"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
