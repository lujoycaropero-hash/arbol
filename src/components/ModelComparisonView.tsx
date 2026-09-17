import React from 'react';
import { Dataset, ModelComparisonResult } from '../types';
import {
  BarChart2,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Zap,
  Layers,
  Award,
  ShieldCheck,
} from 'lucide-react';

interface ModelComparisonViewProps {
  dataset: Dataset;
  comparisonModels: ModelComparisonResult[];
  onSelectModelParams: (model: ModelComparisonResult) => void;
}

export const ModelComparisonView: React.FC<ModelComparisonViewProps> = ({
  dataset,
  comparisonModels,
  onSelectModelParams,
}) => {
  const isClassification = dataset.task === 'classification';

  // Find best test model
  const sorted = [...comparisonModels].sort((a, b) => b.metrics.testScore - a.metrics.testScore);
  const bestModelId = sorted[0]?.id;

  // Aggregate feature importances from the best model or first model
  const topFeatures = comparisonModels.find((m) => m.modelType === 'random_forest')
    ?.featureImportances || comparisonModels[0]?.featureImportances || [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">
              Comparativa de Rendimiento & Generalización
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluación comparativa entre modelos base y optimizados con GridSearchCV sobre el conjunto de prueba independiente
          </p>
        </div>
      </div>

      {/* 4 Models Comparison Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {comparisonModels.map((model) => {
          const isBest = model.id === bestModelId;
          const gap = model.metrics.overfittingGap;
          const isOverfit = gap > 0.12;

          return (
            <div
              key={model.id}
              className={`rounded-xl p-4 flex flex-col justify-between border transition-all relative ${
                isBest
                  ? 'bg-slate-950 border-emerald-500/60 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/40'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {isBest && (
                <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 flex items-center gap-1 shadow">
                  <Award className="w-3 h-3" />
                  Mayor Precisión Test
                </div>
              )}

              {/* Title & Badge */}
              <div className="space-y-1 mb-3">
                <div className="flex items-center gap-1.5">
                  {model.modelType === 'random_forest' ? (
                    <Layers className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <span className="w-3.5 h-3.5 text-slate-400 font-bold">🌿</span>
                  )}
                  <h3 className="font-bold text-sm text-slate-100">{model.name}</h3>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      model.isTuned
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {model.isTuned ? 'Optimizado con GridSearch' : 'Parámetros Base'}
                  </span>
                </div>
              </div>

              {/* Core Score Display */}
              <div className="space-y-2 py-2 border-y border-slate-800/80 my-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Score Test:</span>
                  <span className="text-2xl font-black font-mono text-emerald-400">
                    {(model.metrics.testScore * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-400">Score Train:</span>
                  <span className="font-mono text-slate-300">
                    {(model.metrics.trainScore * 100).toFixed(1)}%
                  </span>
                </div>

                {/* Overfitting Gap */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">Brecha Overfit:</span>
                  <span
                    className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                      isOverfit
                        ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {(gap * 100).toFixed(1)}% {isOverfit ? '⚠️' : '✓'}
                  </span>
                </div>
              </div>

              {/* Secondary Metrics */}
              <div className="space-y-1 text-xs text-slate-400 mb-4">
                <div className="flex justify-between">
                  <span>Profundidad:</span>
                  <span className="font-mono text-slate-200">
                    {model.params.maxDepth === -1 ? 'Sin límite' : model.params.maxDepth}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Muestras división:</span>
                  <span className="font-mono text-slate-200">{model.params.minSamplesSplit}</span>
                </div>
                {model.modelType === 'random_forest' && (
                  <div className="flex justify-between">
                    <span>Árboles (n_est):</span>
                    <span className="font-mono text-slate-200">{model.params.nEstimators || 25}</span>
                  </div>
                )}
                {!isClassification && model.metrics.mse !== undefined && (
                  <div className="flex justify-between">
                    <span>MSE Error:</span>
                    <span className="font-mono text-slate-200">{model.metrics.mse}</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectModelParams(model)}
                className="w-full py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors"
              >
                Cargar en el Visualizador
              </button>
            </div>
          );
        })}
      </div>

      {/* Feature Importance Section (MDI - Scikit-Learn feature_importances_) */}
      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Importancia de Características (Scikit-Learn feature_importances_)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Disminución Media de Impureza (MDI / Gini Importance)
          </span>
        </div>

        {/* Bar Chart */}
        <div className="space-y-3 pt-1">
          {topFeatures.map((feat) => {
            return (
              <div key={feat.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-200">{feat.name}</span>
                  <span className="font-mono font-bold text-emerald-400">{feat.importance}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${feat.importance}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-400 italic pt-1">
          Las características con mayor porcentaje son las que más reducen la impureza en los nodos de división principales.
        </p>
      </div>

      {/* Didactic Takeaways */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-emerald-300">
            <CheckCircle className="w-4 h-4" />
            <span>¿Por qué Random Forest supera al Árbol Individual?</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Un solo árbol de decisión es propenso a una alta <strong>varianza</strong>: pequeñas variaciones en los datos producen árboles muy distintos. Random Forest entrena decenas de árboles con submuestras aleatorias (Bootstrap) y características al azar, y promedia sus votos. Por el teorema del límite central, el error del ensamble es sistemáticamente menor.
          </p>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-amber-300">
            <ShieldCheck className="w-4 h-4" />
            <span>El Rol de GridSearchCV en la Poda</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Un árbol sin restringir alcanza 100% de precisión en entrenamiento memorizando hojas de 1 sola muestra. GridSearchCV encuentra de forma automática el punto dulce de <strong>max_depth</strong> y <strong>min_samples_leaf</strong> donde la curva de validación cruzada alcanza su pico sin caer en el abismo del sobreajuste.
          </p>
        </div>
      </div>
    </div>
  );
};
