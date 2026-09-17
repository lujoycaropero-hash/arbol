import React, { useState } from 'react';
import { CVResult, DataPoint, Dataset, Hyperparameters } from '../types';
import { runKFoldCV } from '../ml/crossValidation';
import { Cpu, Play, CheckCircle2, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

interface CrossValidationViewProps {
  dataset: Dataset;
  data: DataPoint[];
  params: Hyperparameters;
  modelType: 'decision_tree' | 'random_forest';
}

export const CrossValidationView: React.FC<CrossValidationViewProps> = ({
  dataset,
  data,
  params,
  modelType,
}) => {
  const [kFolds, setKFolds] = useState<number>(5);
  const [cvResult, setCvResult] = useState<CVResult | null>(() =>
    runKFoldCV(modelType, dataset, data, params, 5)
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const isClassification = dataset.task === 'classification';

  const handleRunCV = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runKFoldCV(modelType, dataset, data, params, kFolds);
      setCvResult(res);
      setIsRunning(false);
    }, 150);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">
              Validación Cruzada (K-Fold Cross-Validation)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Evalúa la capacidad de generalización real del modelo dividiendo el dataset en K bloques rotativos
          </p>
        </div>

        {/* Control Bar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <label htmlFor="k-select" className="text-slate-300 font-medium">
              Número de Folds (K):
            </label>
            <select
              id="k-select"
              value={kFolds}
              onChange={(e) => setKFolds(Number(e.target.value))}
              className="bg-slate-800 text-slate-100 text-xs rounded-lg px-2.5 py-1.5 border border-slate-700"
            >
              <option value={3}>K = 3 (Rápido)</option>
              <option value={5}>K = 5 (Estándar Scikit-Learn)</option>
              <option value={10}>K = 10 (Exhaustivo)</option>
            </select>
          </div>

          <button
            id="btn-run-cv"
            onClick={handleRunCV}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all disabled:opacity-50"
          >
            {isRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            Ejecutar Validación Cruzada
          </button>
        </div>
      </div>

      {/* Pedagogical Summary Cards */}
      {cvResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Puntaje Medio (CV Mean Score)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-emerald-400">
                {(cvResult.meanValScore * 100).toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ± {(cvResult.stdValScore * 100).toFixed(1)}% (Desv. Est.)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isClassification
                ? 'Precisión (Accuracy) promedio esperada en producción'
                : 'Coeficiente de determinación R² medio'}
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Estabilidad del Modelo</span>
            <div className="flex items-center gap-2">
              {cvResult.stdValScore <= 0.05 ? (
                <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-semibold">
                  <ShieldCheck className="w-4 h-4" /> Alta Estabilidad
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-400 text-sm font-semibold">
                  <AlertCircle className="w-4 h-4" /> Sensible al Split
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {cvResult.stdValScore <= 0.05
                ? 'La varianza entre folds es mínima: el modelo no depende de la suerte de los datos.'
                : 'La varianza entre folds es apreciable: Random Forest o regularización pueden estabilizarlo.'}
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Sobreajuste en CV</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-slate-250 text-slate-200">
                {((cvResult.meanTrainScore - cvResult.meanValScore) * 100).toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400">brecha Train - Val</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Diferencia entre puntaje de entrenamiento y validación cruzada.
            </p>
          </div>
        </div>
      )}

      {/* Interactive K-Fold Diagram */}
      <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800/90">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Esquema de Rotación K-Fold ({kFolds} iteraciones)
          </h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
              <span className="text-slate-300 text-[11px]">Entrenamiento (~{Math.round(100 * (1 - 1 / kFolds))}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
              <span className="text-slate-300 text-[11px]">Validación (~{Math.round(100 / kFolds)}%)</span>
            </div>
          </div>
        </div>

        {/* Folds Rows */}
        <div className="space-y-2.5 pt-2">
          {cvResult?.folds.map((fold) => {
            const valPercent = +(fold.valScore * 100).toFixed(1);
            return (
              <div
                key={fold.foldIndex}
                className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Fold Label */}
                <div className="flex items-center gap-2 w-24 shrink-0">
                  <span className="font-semibold text-xs text-slate-200">
                    Fold #{fold.foldIndex}
                  </span>
                </div>

                {/* Visual Blocks Bar */}
                <div className="flex-1 flex gap-1 h-6 rounded overflow-hidden bg-slate-950 p-0.5 border border-slate-800">
                  {Array.from({ length: kFolds }).map((_, fIdx) => {
                    const isValidation = fIdx === fold.foldIndex - 1;
                    return (
                      <div
                        key={fIdx}
                        className={`flex-1 rounded-sm flex items-center justify-center text-[10px] font-bold transition-all ${
                          isValidation
                            ? 'bg-emerald-500 text-slate-950 shadow-inner'
                            : 'bg-blue-600/70 text-blue-100 hover:bg-blue-600'
                        }`}
                        title={isValidation ? `Fold ${fIdx + 1}: Bloque de Validación (${fold.valIndices.length} muestras)` : `Fold ${fIdx + 1}: Bloque de Entrenamiento`}
                      >
                        {isValidation ? 'Val' : 'Train'}
                      </div>
                    );
                  })}
                </div>

                {/* Fold Result Metrics */}
                <div className="flex items-center justify-end gap-3 w-44 shrink-0 text-xs">
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block">Score Val:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {valPercent}%
                    </span>
                  </div>
                  <div className="text-right border-l border-slate-800 pl-3">
                    <span className="text-slate-400 text-[10px] block">Train:</span>
                    <span className="font-mono text-slate-300">
                      {(fold.trainScore * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Didactic Callout */}
      <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-300/90 leading-relaxed flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-emerald-300">¿Por qué usar Validación Cruzada en Scikit-Learn? </span>
          Si solo dividimos los datos una vez (un simple train/test split al 80/20), podríamos tener "suerte" y dejar las muestras difíciles en el set de entrenamiento, sobrestimando la precisión. K-Fold garantiza que <strong>cada muestra del dataset sea evaluada exactamente una vez como prueba</strong>, arrojando una métrica no sesgada.
        </div>
      </div>
    </div>
  );
};
