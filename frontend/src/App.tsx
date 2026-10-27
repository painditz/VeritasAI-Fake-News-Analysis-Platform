import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ClaimAnalysisWorkspace } from './components/ClaimAnalysisWorkspace';
import { ModelEvaluationDashboard } from './components/ModelEvaluationDashboard';
import { BatchAnalysisModal } from './components/BatchAnalysisModal';
import { AnalysisHistory } from './components/AnalysisHistory';
import { ModelInfoModal } from './components/ModelInfoModal';
import { fetchHealth, fetchModelInfo } from './services/api';
import { HealthResponse, ModelInfoResponse, PredictionResponse } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'workspace' | 'evaluation' | 'batch'>('workspace');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfoResponse | null>(null);
  const [isModelInfoOpen, setIsModelInfoOpen] = useState(false);
  const [history, setHistory] = useState<PredictionResponse[]>([]);
  const [activePrediction, setActivePrediction] = useState<PredictionResponse | null>(null);

  useEffect(() => {
    // Initial health and model info checks
    fetchHealth()
      .then(setHealth)
      .catch((err) => console.warn('Health check issue:', err));

    fetchModelInfo()
      .then(setModelInfo)
      .catch((err) => console.warn('Model info issue:', err));

    // Periodic health poll every 15 seconds
    const interval = setInterval(() => {
      fetchHealth().then(setHealth).catch(() => {});
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handlePredictionComplete = (prediction: PredictionResponse) => {
    setActivePrediction(prediction);
    setHistory((prev) => [prediction, ...prev.slice(0, 19)]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        onOpenModelInfo={() => setIsModelInfoOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {activeTab === 'workspace' && (
          <div className="space-y-6">
            <ClaimAnalysisWorkspace
              onPredictionComplete={handlePredictionComplete}
              activePrediction={activePrediction}
            />
            <AnalysisHistory
              history={history}
              onSelectPrediction={(p) => setActivePrediction(p)}
              onClearHistory={() => setHistory([])}
            />
          </div>
        )}

        {activeTab === 'evaluation' && <ModelEvaluationDashboard />}

        {activeTab === 'batch' && <BatchAnalysisModal />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-700">VeritasAI Platform</span> — BERT 6-Class
            Truthfulness Engine on the LIAR Dataset
          </div>
          <div className="flex items-center space-x-4">
            <span>PyTorch 2.14 CPU/CUDA</span>
            <span>•</span>
            <span>Hugging Face Transformers</span>
            <span>•</span>
            <span>FastAPI + React</span>
          </div>
        </div>
      </footer>

      {/* Model Info Modal */}
      <ModelInfoModal
        isOpen={isModelInfoOpen}
        onClose={() => setIsModelInfoOpen(false)}
        modelInfo={modelInfo}
      />
    </div>
  );
};

export default App;
