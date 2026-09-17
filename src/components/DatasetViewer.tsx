import React from 'react';
import { Dataset } from '../types';
import { Database, HelpCircle } from 'lucide-react';

interface DatasetViewerProps {
  dataset: Dataset;
}

export const DatasetViewer: React.FC<DatasetViewerProps> = ({ dataset }) => {
  const isClassification = dataset.task === 'classification';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-100">
            {dataset.name}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-mono">
            {dataset.data.length} muestras
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 font-mono">
            {dataset.featureNames.length} características
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-mono font-medium">
            {Math.round(dataset.trainRatio * 100)}% Train / {Math.round((1 - dataset.trainRatio) * 100)}% Test
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        {dataset.description}
      </p>

      {/* Feature Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
        {dataset.featureNames.map((name, idx) => {
          const vals = dataset.data.map((d) => d.features[idx]);
          const min = Math.min(...vals);
          const max = Math.max(...vals);
          const desc = dataset.featureDescriptions[idx];

          return (
            <div
              key={name}
              className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 text-xs space-y-1"
            >
              <div className="font-semibold text-slate-200 truncate flex items-center justify-between">
                <span>{name}</span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-2" title={desc}>
                {desc}
              </p>
              <div className="text-[10px] font-mono text-slate-500 pt-0.5">
                Rango: [{min}, {max}]
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
