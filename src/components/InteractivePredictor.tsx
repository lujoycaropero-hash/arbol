import React, { useState } from 'react';
import { Dataset, TreeNode } from '../types';
import { traceSamplePath, TraversalStep } from '../ml/treeEngine';
import { ForestEnsemble } from '../ml/randomForestEngine';
import { Sliders, Sparkles, GitCommit, Layers, ArrowRight } from 'lucide-react';

interface InteractivePredictorProps {
  dataset: Dataset;
  rootTree: TreeNode;
  forest: ForestEnsemble;
  onUpdateHighlightPoint?: (point: number[]) => void;
  onUpdateHighlightedNodes?: (nodeIds: Set<string>) => void;
}

export const InteractivePredictor: React.FC<InteractivePredictorProps> = ({
  dataset,
  rootTree,
  forest,
  onUpdateHighlightPoint,
  onUpdateHighlightedNodes,
}) => {
  const isClassification = dataset.task === 'classification';

  // Feature input values state (initialize with median feature values)
  const [featureValues, setFeatureValues] = useState<number[]>(() => {
    return dataset.featureNames.map((_, idx) => {
      const vals = dataset.data.map((d) => d.features[idx]).sort((a, b) => a - b);
      return vals[Math.floor(vals.length / 2)] || 0;
    });
  });

  // Calculate feature ranges for sliders
  const featureRanges = dataset.featureNames.map((_, idx) => {
    const vals = dataset.data.map((d) => d.features[idx]);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const step = +( (max - min) / 50 ).toFixed(2) || 0.1;
    return { min, max, step };
  });

  const handleSliderChange = (idx: number, val: number) => {
    const updated = [...featureValues];
    updated[idx] = val;
    setFeatureValues(updated);

    if (onUpdateHighlightPoint) {
      onUpdateHighlightPoint(updated);
    }

    // Trace path in decision tree
    const path = traceSamplePath(rootTree, updated);
    const nodeIds = new Set(path.map((step) => step.nodeId));
    if (onUpdateHighlightedNodes) {
      onUpdateHighlightedNodes(nodeIds);
    }
  };

  // Traversal path in Decision Tree
  const treePath: TraversalStep[] = traceSamplePath(rootTree, featureValues);
  const treeFinalStep = treePath[treePath.length - 1];
  const treePrediction = treeFinalStep?.prediction;
  const treePredictionLabel = treeFinalStep?.predictionLabel;

  // Forest votes / prediction
  const forestPrediction = forest.predict(featureValues);
  const forestVotes = forest.predictAllVotes(featureValues);

  // For classification: count votes per class
  const classVoteCounts = (dataset.targetLabels || []).map((label, cIdx) => {
    const count = forestVotes.filter((v) => v === cIdx).length;
    const pct = forestVotes.length > 0 ? (count / forestVotes.length) * 100 : 0;
    return { label, count, pct };
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">
              Laboratorio de Predicción Interactiva (What-If Simulator)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Mueve los controles de las características para ver en vivo cómo el Árbol recorre sus ramas y cómo vota el Bosque Aleatorio
          </p>
        </div>
      </div>

      {/* Grid: Sliders on left, Model Predictions on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Valores de Entrada para la Muestra</span>
          </div>

          <div className="space-y-3.5">
            {dataset.featureNames.map((name, idx) => {
              const { min, max, step } = featureRanges[idx];
              const val = featureValues[idx];

              return (
                <div key={name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{name}:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {val}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={val}
                    onChange={(e) => handleSliderChange(idx, Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>min: {min}</span>
                    <span>max: {max}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Prediction Results Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Side-by-Side Prediction Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Decision Tree Prediction */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">🌿</span>
                <span className="text-xs font-semibold text-slate-300">
                  Árbol de Decisión
                </span>
              </div>
              <div className="py-1">
                <span className="text-xs text-slate-400 block">Predicción:</span>
                <span className="text-xl font-black font-mono text-emerald-400">
                  {treePredictionLabel || treePrediction}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Determinado por 1 regla determinista a través de {treePath.length - 1} bifurcaciones.
              </p>
            </div>

            {/* 2. Random Forest Prediction */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-300">
                  Random Forest (Ensamble)
                </span>
              </div>
              <div className="py-1">
                <span className="text-xs text-slate-400 block">Predicción del Ensamble:</span>
                <span className="text-xl font-black font-mono text-emerald-400">
                  {isClassification
                    ? dataset.targetLabels?.[forestPrediction] || forestPrediction
                    : `${forestPrediction} (promedio)`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Consenso de {forest.nEstimators} árboles independientes mediante {isClassification ? 'mayoría de votos' : 'promedio'}.
              </p>
            </div>
          </div>

          {/* Random Forest Vote Distribution (if classification) */}
          {isClassification && (
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <span className="text-xs font-semibold text-slate-300 block">
                Distribución de Votos en el Bosque ({forest.nEstimators} árboles):
              </span>
              <div className="space-y-2">
                {classVoteCounts.map((c) => (
                  <div key={c.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">{c.label}</span>
                      <span className="font-mono text-slate-400">
                        {c.count} votos ({c.pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${c.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tree Decision Path Traversal Breakdown */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-200">
                Camino Recorrido en el Árbol (Decision Path):
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {treePath.map((step, idx) => {
                if (step.decision === 'leaf') {
                  return (
                    <div
                      key={step.nodeId}
                      className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold">✓ Hoja Final:</span>
                        <span>Predicción: {step.predictionLabel}</span>
                      </div>
                      <span className="font-mono text-[11px] opacity-80">
                        Profundidad: {step.depth}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={step.nodeId}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-slate-300"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] text-slate-500">
                        Paso {idx + 1}:
                      </span>
                      <span>
                        {step.featureName} ({step.value})
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="font-mono text-emerald-400 font-semibold">
                        {step.decision === 'left' ? '≤' : '>'} {step.threshold}
                      </span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        Ramas a la {step.decision === 'left' ? 'Izquierda (Sí)' : 'Derecha (No)'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
