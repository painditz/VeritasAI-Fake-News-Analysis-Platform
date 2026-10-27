import React from 'react';
import { ExternalLink, BookOpen, AlertTriangle, CheckCircle, Info, Calendar } from 'lucide-react';
import { EvidenceResponse, EvidenceItem } from '../types';

interface EvidenceVerificationCardProps {
  evidence: EvidenceResponse;
}

export const EvidenceVerificationCard: React.FC<EvidenceVerificationCardProps> = ({ evidence }) => {
  const getAlignmentBadge = (category: EvidenceItem['alignment_category']) => {
    switch (category) {
      case 'supporting':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>Supporting / Corroborative</span>
          </span>
        );
      case 'conflicting':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Conflicting / Cautionary</span>
          </span>
        );
      case 'neutral_context':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <Info className="w-3 h-3 text-slate-500" />
            <span>Background Context</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      {/* Header and Retrieval Modality */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-4">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-brand-600" />
          <div>
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">
              Evidence Document Retrieval
            </h3>
            <p className="text-xs text-slate-500">
              Source documents retrieved for cross-referencing and contextual fact verification
            </p>
          </div>
        </div>
        <div className="text-xs bg-slate-50 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200 font-mono">
          Method: <span className="font-semibold text-slate-800">{evidence.retrieval_method}</span>
        </div>
      </div>

      {/* Critical Distinction Notice (Section 4 mandate) */}
      <div className="bg-amber-50/60 border border-amber-200/80 rounded-lg p-3 text-xs text-amber-900 mb-5 flex items-start space-x-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">CRITICAL SEPARATION OF CONCERNS:</span> The evidence below is
          retrieved via institutional reference documents and public knowledge archives. It operates{' '}
          <span className="underline font-medium">independently</span> of BERT's statistical label
          probabilities. Do not conclude factual veracity solely from model classification scores.
        </div>
      </div>

      {/* Document Items List */}
      <div className="space-y-4">
        {evidence.items.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            No matching reference documents were found for this query in the available archives.
          </div>
        ) : (
          evidence.items.map((doc, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg bg-slate-50/70 border border-slate-200 hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 hover:text-brand-600 transition-colors">
                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 hover:underline"
                      >
                        <span>{doc.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </a>
                    ) : (
                      doc.title
                    )}
                  </h4>
                  <div className="text-xs text-slate-500 flex items-center space-x-3 mt-1">
                    <span className="font-medium text-slate-700">{doc.source}</span>
                    {doc.published_date && (
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{doc.published_date}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {getAlignmentBadge(doc.alignment_category)}
                  <span className="text-xs font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    rel: {(doc.relevance_score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Excerpt Snippet */}
              <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded border border-slate-100 font-sans">
                "{doc.snippet}"
              </p>
            </div>
          ))
        )}
      </div>

      {/* Retrieval Summary Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
        <span>{evidence.retrieval_summary}</span>
      </div>
    </div>
  );
};
