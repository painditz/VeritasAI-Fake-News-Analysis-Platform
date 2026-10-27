import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Download, AlertCircle, RefreshCw } from 'lucide-react';
import { analyzeBatchClaims } from '../services/api';
import { BatchPredictionResponse } from '../types';

export const BatchAnalysisModal: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [manualText, setManualText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchResult, setBatchResult] = useState<BatchPredictionResponse | null>(null);

  const sampleCSV = `Building a wall on the U.S.-Mexico border will take literally years.
Says Texas has the highest uninsured rate in the nation.
The cost of healthcare in the United States has dropped by 40 percent.
Scientists at NASA confirmed the discovery of an Earth-sized exoplanet.
Under the new legislation every citizen will receive five thousand dollars.`;

  const parseStatements = (text: string): string[] => {
    return text
      .split('\n')
      .map((s) => s.trim().replace(/^["']|["']$/g, ''))
      .filter((s) => s.length > 5);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setManualText(content);
      };
      reader.readAsText(uploadedFile);
    }
  };

  const handleRunBatch = async () => {
    const statements = parseStatements(manualText);
    if (statements.length === 0) {
      setError('Please provide at least one valid statement (at least 5 characters).');
      return;
    }
    if (statements.length > 200) {
      setError('Batch limit is 200 statements per request.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await analyzeBatchClaims(statements, false);
      setBatchResult(res);
    } catch (err: any) {
      setError(err.message || 'Batch inference failed.');
    } finally {
      setLoading(false);
    }
  };

  const exportResultsCSV = () => {
    if (!batchResult) return;
    const header = 'Statement,Predicted Label,Confidence,Latency (ms)\n';
    const rows = batchResult.predictions
      .map(
        (p) =>
          `"${p.statement.replace(/"/g, '""')}","${p.predicted_label}",${p.confidence.toFixed(4)},${p.inference_latency_ms}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `veritas_ai_batch_analysis_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 tracking-tight flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-brand-600" />
              <span>Batch Claim Analysis via CSV / Text Stream</span>
            </h2>
            <p className="text-xs text-slate-500">
              High-throughput parallel inference across multiple claims (up to 200 per batch)
            </p>
          </div>

          <button
            type="button"
            onClick={() => setManualText(sampleCSV)}
            className="text-xs text-brand-600 hover:text-brand-800 font-medium underline"
          >
            Load Sample CSV Claims
          </button>
        </div>

        {/* Input Methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Upload CSV / Plaintext File
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-5 text-center hover:bg-slate-50 transition-colors">
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <label className="cursor-pointer text-xs text-brand-600 hover:underline font-semibold">
                Browse file on your computer
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-slate-400 mt-1">One statement per line or CSV column</p>
              {file && (
                <div className="mt-2 text-xs font-mono text-slate-700 bg-slate-100 py-1 px-2 rounded inline-block">
                  Loaded: {file.name}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Or Paste Text Statements (one per line)
            </label>
            <textarea
              rows={5}
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Paste rows here..."
              className="w-full text-xs font-mono rounded-lg border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Run Action */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500 font-mono">
            {parseStatements(manualText).length} statements detected
          </span>

          <button
            onClick={handleRunBatch}
            disabled={loading || parseStatements(manualText).length === 0}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 rounded-lg transition-all flex items-center space-x-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Processing Batch Forward Pass...</span>
              </>
            ) : (
              <span>Execute Batch Analysis</span>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results Table */}
      {batchResult && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Batch Analysis Results ({batchResult.total_items} claims)
              </h3>
              <p className="text-xs text-slate-500">
                Total batch time: {batchResult.batch_latency_ms} ms (avg {batchResult.average_item_latency_ms} ms/claim)
              </p>
            </div>

            <button
              onClick={exportResultsCSV}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="py-2.5 px-3 font-semibold">#</th>
                  <th className="py-2.5 px-3 font-semibold">Statement</th>
                  <th className="py-2.5 px-3 font-semibold">Predicted Class</th>
                  <th className="py-2.5 px-3 font-semibold">Confidence</th>
                  <th className="py-2.5 px-3 font-semibold">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batchResult.predictions.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 text-slate-800 font-sans max-w-md truncate">
                      {p.statement}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {p.predicted_label.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                      {(p.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">
                      {p.inference_latency_ms} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
