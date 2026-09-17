import React from 'react';
import { Criterion, Dataset, Hyperparameters, ModelMetrics } from '../types';
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Sliders,
  TrendingDown,
  Zap,
} from 'lucide-react';

interface HyperparameterPanelProps {
  dataset: Dataset;
  params: Hyperparameters;
  onChangeParams: (newParams: Hyperparameters) => void;
  metrics: ModelMetrics;
  modelType: 'decision_tree' | 'random_forest';
}

export const HyperparameterPanel: React.FC<HyperparameterPanelProps> = ({
  dataset,
  params,
  onChangeParams,
  metrics,
  modelType,
}) => {
  const isClassification = dataset.task === 'classification';

  const handleUpdate = (partial: Partial<Hyperparameters>) => {
    onChangeParams({ ...params, ...partial });
  };

  // Overfitting calculation
  const gap = metrics.overfittingGap;
  const isOverfitting = gap > 0.12;
  const isUnderfitting = metrics.trainScore < 0.65;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header & Quick Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-slate-100">
            Control de Hiperparámetros
          </h2>
          <span className="text-xs text-slate-400">
            ({modelType === 'decision_tree' ? 'Scikit-Learn DecisionTree' : 'RandomForest'})
          </span>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400">Preajustes:</span>
          <button
            id="preset-default"
            onClick={() =>
              handleUpdate({
                maxDepth: 8,
                minSamplesSplit: 2,
                minSamplesLeaf: 1,
                nEstimators: 25,
              })
            }
            className="text-xs px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Sin poda: tiende a memorizar el ruido"
          >
            Libre (Riesgo Overfit)
          </button>
          <button
            id="preset-balanced"
            onClick={() =>
              handleUpdate({
                maxDepth: 4,
                minSamplesSplit: 6,
                minSamplesLeaf: 3,
                nEstimators: 30,
              })
            }
            className="text-xs px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/60 transition-colors"
            title="Poda óptima para generalizar bien"
          >
            Óptimo Didáctico
          </button>
          <button
            id="preset-reset"
            onClick={() =>
              handleUpdate({
                maxDepth: 3,
                minSamplesSplit: 4,
                minSamplesLeaf: 2,
                criterion: isClassification ? 'gini' : 'squared_error',
                nEstimators: 25,
              })
            }
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Restablecer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Overfitting Status Meter */}
      <div
        className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 transition-colors ${
          isOverfitting
            ? 'bg-rose-950/40 border-rose-500/30 text-rose-200'
            : isUnderfitting
            ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
            : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
        }`}
      >
        {isOverfitting ? (
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        ) : isUnderfitting ? (
          <TrendingDown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        )}

        <div className="space-y-0.5 flex-1">
          <div className="font-semibold flex items-center justify-between">
            <span>
              {isOverfitting
                ? '⚠️ Riesgo de Sobreajuste (Overfitting)'
                : isUnderfitting
                ? '⚠️ Riesgo de Subajuste (Underfitting)'
                : '✅ Excelente Equilibrio (Buena Generalización)'}
            </span>
            <span className="font-mono text-[11px] opacity-80">
              Brecha Train/Test: {(gap * 100).toFixed(1)}%
            </span>
          </div>
          <p className="text-[11px] opacity-90 leading-relaxed">
            {isOverfitting
              ? `El modelo rinde mucho mejor en Entrenamiento (${(metrics.trainScore * 100).toFixed(0)}%) que en Prueba (${(metrics.testScore * 100).toFixed(0)}%). Reduce 'max_depth' o aumenta 'min_samples_leaf' para regularizar.`
              : isUnderfitting
              ? `El modelo es demasiado simple (Score: ${(metrics.testScore * 100).toFixed(0)}%). Aumenta 'max_depth' para permitir que aprenda patrones relevantes.`
              : `La brecha entre entrenamiento (${(metrics.trainScore * 100).toFixed(0)}%) y prueba (${(metrics.testScore * 100).toFixed(0)}%) es baja. El modelo generaliza de forma robusta.`}
          </p>
        </div>
      </div>

      {/* Hiperparámetros Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        {/* 1. max_depth */}
        <div className="space-y-1.5 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 font-medium text-slate-200">
              <span>max_depth</span>
              <span className="text-[10px] text-slate-400">(Profundidad Máx)</span>
            </div>
            <span className="font-mono font-bold text-emerald-400 px-1.5 py-0.5 bg-slate-800 rounded">
              {params.maxDepth === -1 ? 'None (Ilimitada)' : params.maxDepth}
            </span>
          </div>
          <input
            id="input-max-depth"
            type="range"
            min={1}
            max={10}
            value={params.maxDepth === -1 ? 10 : params.maxDepth}
            onChange={(e) => handleUpdate({ maxDepth: Number(e.target.value) })}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>1 (Simple)</span>
            <span>4 (Típico)</span>
            <span>10 (Profundo)</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-snug">
            Controla cuántas preguntas consecutivas puede hacer el árbol. Valores altos memorizan cada punto.
          </p>
        </div>

        {/* 2. min_samples_split */}
        <div className="space-y-1.5 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 font-medium text-slate-200">
              <span>min_samples_split</span>
              <span className="text-[10px] text-slate-400">(Muestras p/ Dividir)</span>
            </div>
            <span className="font-mono font-bold text-emerald-400 px-1.5 py-0.5 bg-slate-800 rounded">
              {params.minSamplesSplit}
            </span>
          </div>
          <input
            id="input-min-samples-split"
            type="range"
            min={2}
            max={20}
            value={params.minSamplesSplit}
            onChange={(e) => handleUpdate({ minSamplesSplit: Number(e.target.value) })}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>2 (Fácil división)</span>
            <span>10</span>
            <span>20 (Conservador)</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-snug">
            Número mínimo de muestras que debe contener un nodo para intentar crear ramas hijas.
          </p>
        </div>

        {/* 3. min_samples_leaf */}
        <div className="space-y-1.5 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 font-medium text-slate-200">
              <span>min_samples_leaf</span>
              <span className="text-[10px] text-slate-400">(Muestras en Hoja)</span>
            </div>
            <span className="font-mono font-bold text-emerald-400 px-1.5 py-0.5 bg-slate-800 rounded">
              {params.minSamplesLeaf}
            </span>
          </div>
          <input
            id="input-min-samples-leaf"
            type="range"
            min={1}
            max={15}
            value={params.minSamplesLeaf}
            onChange={(e) => handleUpdate({ minSamplesLeaf: Number(e.target.value) })}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>1 (Permite hojas aisladas)</span>
            <span>5</span>
            <span>15 (Hojas pobladas)</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-snug">
            Garantiza que toda hoja terminal tenga al menos este número de datos, suavizando la frontera.
          </p>
        </div>

        {/* 4. criterion */}
        <div className="space-y-1.5 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 font-medium text-slate-200">
              <span>criterion</span>
              <span className="text-[10px] text-slate-400">(Función de Impureza)</span>
            </div>
          </div>
          {isClassification ? (
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                id="btn-criterion-gini"
                onClick={() => handleUpdate({ criterion: 'gini' })}
                className={`px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${
                  params.criterion === 'gini'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Gini (Rápido)
              </button>
              <button
                id="btn-criterion-entropy"
                onClick={() => handleUpdate({ criterion: 'entropy' })}
                className={`px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${
                  params.criterion === 'entropy'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Entropy (Teoría Info)
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                id="btn-criterion-squared"
                onClick={() => handleUpdate({ criterion: 'squared_error' })}
                className={`px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${
                  params.criterion === 'squared_error'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Squared Error (MSE)
              </button>
              <button
                id="btn-criterion-absolute"
                onClick={() => handleUpdate({ criterion: 'absolute_error' })}
                className={`px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${
                  params.criterion === 'absolute_error'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Absolute Error (MAE)
              </button>
            </div>
          )}
          <p className="text-[10px] text-slate-400 leading-snug">
            Mide la calidad de cada división. En clasificación, Gini minimiza la probabilidad de error.
          </p>
        </div>

        {/* 5. Random Forest specific: n_estimators */}
        {modelType === 'random_forest' && (
          <div className="space-y-1.5 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 font-medium text-slate-200">
                <span>n_estimators</span>
                <span className="text-[10px] text-slate-400">(Árboles en el Bosque)</span>
              </div>
              <span className="font-mono font-bold text-emerald-400 px-1.5 py-0.5 bg-slate-800 rounded">
                {params.nEstimators || 25}
              </span>
            </div>
            <input
              id="input-n-estimators"
              type="range"
              min={5}
              max={60}
              step={5}
              value={params.nEstimators || 25}
              onChange={(e) => handleUpdate({ nEstimators: Number(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>5 árboles</span>
              <span>25</span>
              <span>60 árboles</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              Más árboles reducen la varianza del ensamble sin aumentar el riesgo de sobreajuste.
            </p>
          </div>
        )}

        {/* 6. Random Forest specific: max_features */}
        {modelType === 'random_forest' && (
          <div className="space-y-1.5 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 font-medium text-slate-200">
                <span>max_features</span>
                <span className="text-[10px] text-slate-400">(Subespacio Aleatorio)</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                id="btn-features-sqrt"
                onClick={() => handleUpdate({ maxFeaturesRatio: 0.5 })}
                className={`px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${
                  (params.maxFeaturesRatio || 0.5) <= 0.6
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                sqrt(p) / 50%
              </button>
              <button
                id="btn-features-all"
                onClick={() => handleUpdate({ maxFeaturesRatio: 1.0 })}
                className={`px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${
                  (params.maxFeaturesRatio || 0.5) > 0.6
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                100% (Todas)
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              Descorrelaciona los árboles eligiendo un subconjunto aleatorio de variables en cada split.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
