import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ClassProbability } from '../types';

interface SixClassProbabilityChartProps {
  probabilities: Record<string, number>;
  rankedProbabilities: ClassProbability[];
}

const LABEL_CONFIG: Record<
  string,
  { name: string; color: string; order: number; description: string }
> = {
  'pants-fire': {
    name: 'Pants on Fire',
    color: '#991b1b', // Deep ruby
    order: 1,
    description: 'Egregiously false assertion with no factual grounding',
  },
  false: {
    name: 'False',
    color: '#dc2626', // Crimson
    order: 2,
    description: 'Factually inaccurate statement',
  },
  'barely-true': {
    name: 'Barely True',
    color: '#ea580c', // Orange
    order: 3,
    description: 'Contains minor true element but distorts primary facts',
  },
  'half-true': {
    name: 'Half True',
    color: '#d97706', // Amber
    order: 4,
    description: 'Partially accurate but omits key contextual details',
  },
  'mostly-true': {
    name: 'Mostly True',
    color: '#0d9488', // Teal
    order: 5,
    description: 'Accurate overall but requires minor clarification',
  },
  true: {
    name: 'True',
    color: '#059669', // Emerald
    order: 6,
    description: 'Factually verified and accurate statement',
  },
};

export const SixClassProbabilityChart: React.FC<SixClassProbabilityChartProps> = ({
  probabilities,
}) => {
  // Ordered from pants-fire to true along the spectrum
  const chartData = Object.entries(probabilities)
    .map(([label, prob]) => {
      const conf = LABEL_CONFIG[label] || {
        name: label,
        color: '#64748b',
        order: 99,
        description: '',
      };
      return {
        label,
        displayName: conf.name,
        probability: Math.round(prob * 1000) / 10, // percentage e.g. 27.5%
        rawProb: prob,
        color: conf.color,
        order: conf.order,
        description: conf.description,
      };
    })
    .sort((a, b) => a.order - b.order);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs max-w-xs border border-slate-700">
          <div className="flex items-center space-x-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-semibold text-sm">{data.displayName}</span>
          </div>
          <div className="font-mono text-emerald-400 font-bold mb-1">
            {data.probability.toFixed(1)}% ({data.rawProb.toFixed(4)})
          </div>
          <p className="text-slate-300 leading-relaxed">{data.description}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
            Six-Class Truthfulness Distribution
          </h3>
          <p className="text-xs text-slate-500">
            Softmax output probabilities across the full LIAR spectrum
          </p>
        </div>
        <span className="text-xs text-slate-400 font-mono">Sum = 100%</span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis
              type="number"
              domain={[0, 100]}
              unit="%"
              tick={{ fontSize: 11, fill: '#64748b' }}
              stroke="#e2e8f0"
            />
            <YAxis
              type="category"
              dataKey="displayName"
              tick={{ fontSize: 12, fill: '#334155' }}
              stroke="#e2e8f0"
              width={90}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="probability" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {chartData.map((item) => (
          <div key={item.label} className="flex items-center space-x-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-slate-600 truncate">{item.displayName}:</span>
            <span className="font-mono font-semibold text-slate-800 ml-auto">
              {item.probability.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
