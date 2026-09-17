import React, { useState } from 'react';
import { DataPoint, Dataset, GridSearchCell, GridSearchResult, Hyperparameters } from '../types';
import { runGridSearch } from '../ml/crossValidation';
import {
  Sparkles,
  Play,
  CheckCircle2,
  Trophy,
  ArrowRight,
  Flame,
  Info,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface GridSearchLabProps {
  dataset: Dataset;
  data: DataPoint[];
  modelType: 'decision_tree' | 'random_forest';
  onApplyBestParams: (params: Hyperparameters) => void;
}

export const GridSearchLab: React.FC<GridSearchLabProps> = ({
  dataset,
  data,
  modelType,
  onApplyBestParams,
}) => {
  // Grid parameters checkboxes state
  const [depthOptions, setDepthOptions] = useState<number[]>([2, 3, 4, 6]);
  const [splitOptions, setSplitOptions] = useState<number[]>([2, 5, 10]);
  const [leafOptions, setLeafOptions] = useState<number[]>([1, 2, 4]);
  const [nEstimatorOptions, setNEstimatorOptions] = useState<number[]>([15, 30]);
  const [kFolds, setKFolds] = useState<number>(5);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [gridResult, setGridResult] = useState<GridSearchResult | null>(null);

  const isClassification = dataset.task === 'classification';

  // Calculate combinations
  const totalCombinations =
    depthOptions.length *
    splitOptions.length *
    leafOptions.length *
    (modelType === 'random_forest' ? nEstimatorOptions.length : 1);
  const totalFits = totalCombinations * kFolds;

  const toggleOption = (list: number[], val: number, setter: (v: number[]) => void) => {
    if (list.includes(val)) {
      if (list.length > 1) setter(list.filter((x) => x !== val));
    } else {
      setter([...list, val].sort((a, b) => a - b));
    }
  };

  const handleStartGridSearch = async () => {
    setIsRunning(true);
    setProgressPercent(0);

    const paramGrid = {
      maxDepth: depthOptions,
      minSamplesSplit: splitOptions,
      minSamplesLeaf: leafOptions,
      nEstimators: modelType === 'random_forest' ? nEstimatorOptions : undefined,
    };

    try {
      const result = await runGridSearch(
        modelType,
        dataset,
        data,
        paramGrid,
        kFolds,
        (_, pct) => setProgressPercent(pct)
      );

      setGridResult(result);
      setIsRunning(false);

      // Celebration confetti for best model!
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Ignore confetti error if canvas detached
      }
    } catch (err) {
      console.error(err);
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100">
              Búsqueda en Rejilla (GridSearchCV) con Scikit-Learn
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Explora de manera sistemática y exhaustiva las combinaciones de hiperparámetros evaluándolas con K-Fold CV
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            id="btn-launch-gridsearch"
            onClick={handleStartGridSearch}
            disabled={isRunning || totalCombinations === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 shadow-md transition-all disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Optimizando ({progressPercent}%)...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Ejecutar GridSearchCV ({totalCombinations} combos)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid Configuration Options */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
        {/* max_depth choices */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            max_depth:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[2, 3, 4, 6, 8].map((depth) => {
              const active = depthOptions.includes(depth);
              return (
                <button
                  key={depth}
                  onClick={() => toggleOption(depthOptions, depth, setDepthOptions)}
                  className={`px-2 py-1 rounded text-xs font-mono font-medium border transition-colors ${
                    active
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {depth}
                </button>
              );
            })}
          </div>
        </div>

        {/* min_samples_split choices */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            min_samples_split:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[2, 4, 6, 10].map((split) => {
              const active = splitOptions.includes(split);
              return (
                <button
                  key={split}
                  onClick={() => toggleOption(splitOptions, split, setSplitOptions)}
                  className={`px-2 py-1 rounded text-xs font-mono font-medium border transition-colors ${
                    active
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {split}
                </button>
              );
            })}
          </div>
        </div>

        {/* min_samples_leaf choices */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            min_samples_leaf:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 4, 8].map((leaf) => {
              const active = leafOptions.includes(leaf);
              return (
                <button
                  key={leaf}
                  onClick={() => toggleOption(leafOptions, leaf, setLeafOptions)}
                  className={`px-2 py-1 rounded text-xs font-mono font-medium border transition-colors ${
                    active
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {leaf}
                </button>
              );
            })}
          </div>
        </div>

        {/* Random Forest n_estimators or Folds */}
        <div className="space-y-2">
          {modelType === 'random_forest' ? (
            <>
              <label className="text-xs font-semibold text-slate-300 block">
                n_estimators (Árboles):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[15, 30, 50].map((nest) => {
                  const active = nEstimatorOptions.includes(nest);
                  return (
                    <button
                      key={nest}
                      onClick={() =>
                        toggleOption(nEstimatorOptions, nest, setNEstimatorOptions)
                      }
                      className={`px-2 py-1 rounded text-xs font-mono font-medium border transition-colors ${
                        active
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {nest}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <label className="text-xs font-semibold text-slate-300 block">
                Folds de CV (k):
              </label>
              <select
                value={kFolds}
                onChange={(e) => setKFolds(Number(e.target.value))}
                className="bg-slate-800 text-slate-200 rounded px-2.5 py-1 text-xs border border-slate-700"
              >
                <option value={3}>3 Folds</option>
                <option value={5}>5 Folds (Estándar)</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar (during search) */}
      {isRunning && (
        <div className="space-y-1.5 bg-slate-950 p-4 rounded-xl border border-slate-800 animate-pulse">
          <div className="flex justify-between text-xs text-slate-300 font-medium">
            <span>Evaluando cuadrícula de hiperparámetros con {kFolds}-Fold CV...</span>
            <span className="font-mono text-emerald-400">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Total de entrenamientos: {totalFits} modelos evaluados de forma cruzada.
          </p>
        </div>
      )}

      {/* Results Section: Best Estimator Card & Heatmap */}
      {gridResult && (
        <div className="space-y-4">
          {/* Winner Banner */}
          <div className="bg-gradient-to-r from-amber-950/40 via-emerald-950/40 to-slate-900 border border-amber-500/40 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
                    Mejor Estimador Encontrado (Best Estimator)
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                    Scikit-Learn GridSearchCV.best_params_
                  </span>
                </div>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                    Score CV: {(gridResult.bestScore * 100).toFixed(1)}%
                  </span>
                  <span className="text-xs text-slate-300 font-mono">
                    max_depth={gridResult.bestParams.maxDepth}, min_samples_split={gridResult.bestParams.minSamplesSplit}, min_samples_leaf={gridResult.bestParams.minSamplesLeaf}
                    {gridResult.bestParams.nEstimators ? `, n_estimators=${gridResult.bestParams.nEstimators}` : ''}
                  </span>
                </div>
              </div>
            </div>

            <button
              id="btn-apply-best-params"
              onClick={() => onApplyBestParams(gridResult.bestParams)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all shrink-0"
            >
              <span>Aplicar al Modelo Activo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Heatmap Matrix (max_depth vs min_samples_split) */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Mapa de Rendimiento de la Rejilla (Score Medio de CV)
                </h3>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>Rendimiento:</span>
                <div className="w-16 h-2 rounded bg-gradient-to-r from-slate-800 via-emerald-800 to-emerald-400" />
                <span>Bajo → Máximo</span>
              </div>
            </div>

            {/* Grid Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="p-2 font-mono">max_depth</th>
                    <th className="p-2 font-mono">min_samples_split</th>
                    <th className="p-2 font-mono">min_samples_leaf</th>
                    {modelType === 'random_forest' && (
                      <th className="p-2 font-mono">n_estimators</th>
                    )}
                    <th className="p-2 font-mono text-right">Score CV (Val)</th>
                    <th className="p-2 font-mono text-right">Score Train</th>
                    <th className="p-2 font-mono text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {gridResult.evaluatedCells.map((cell) => {
                    const isWinner = cell.isBest;
                    const valPct = +(cell.meanScore * 100).toFixed(1);
                    const trainPct = +(cell.trainMeanScore * 100).toFixed(1);
                    const gap = trainPct - valPct;

                    return (
                      <tr
                        key={cell.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isWinner ? 'bg-emerald-950/40 font-semibold text-emerald-300' : 'text-slate-300'
                        }`}
                      >
                        <td className="p-2 font-mono">{cell.params.maxDepth}</td>
                        <td className="p-2 font-mono">{cell.params.minSamplesSplit}</td>
                        <td className="p-2 font-mono">{cell.params.minSamplesLeaf}</td>
                        {modelType === 'random_forest' && (
                          <td className="p-2 font-mono">{cell.params.nEstimators}</td>
                        )}
                        <td className="p-2 font-mono font-bold text-right text-emerald-400">
                          {valPct}%
                        </td>
                        <td className="p-2 font-mono text-right text-slate-400">
                          {trainPct}%
                        </td>
                        <td className="p-2 text-center">
                          {isWinner ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              ★ Ganador
                            </span>
                          ) : gap > 15 ? (
                            <span className="text-[10px] text-rose-400">
                              Overfitting ({gap.toFixed(0)}% gap)
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Estable</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Code snippet guide */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-slate-200">
          <Info className="w-4 h-4 text-emerald-400" />
          <span>Equivalente en Python Scikit-Learn:</span>
        </div>
        <pre className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto">
{`from sklearn.model_selection import GridSearchCV
${
  modelType === 'decision_tree'
    ? isClassification
      ? 'from sklearn.tree import DecisionTreeClassifier\nmodel = DecisionTreeClassifier(random_state=42)'
      : 'from sklearn.tree import DecisionTreeRegressor\nmodel = DecisionTreeRegressor(random_state=42)'
    : isClassification
    ? 'from sklearn.ensemble import RandomForestClassifier\nmodel = RandomForestClassifier(random_state=42)'
    : 'from sklearn.ensemble import RandomForestRegressor\nmodel = RandomForestRegressor(random_state=42)'
}

param_grid = {
    'max_depth': [${depthOptions.join(', ')}],
    'min_samples_split': [${splitOptions.join(', ')}],
    'min_samples_leaf': [${leafOptions.join(', ')}],${
  modelType === 'random_forest' ? `\n    'n_estimators': [${nEstimatorOptions.join(', ')}],` : ''
}
}

grid_search = GridSearchCV(estimator=model, param_grid=param_grid, cv=${kFolds}, scoring='${
  isClassification ? 'accuracy' : 'r2'
}', n_jobs=-1)
grid_search.fit(X_train, y_train)

print("Mejores parámetros:", grid_search.best_params_)
print("Mejor score CV:", grid_search.best_score_)
best_model = grid_search.best_estimator_`}
        </pre>
      </div>
    </div>
  );
};
