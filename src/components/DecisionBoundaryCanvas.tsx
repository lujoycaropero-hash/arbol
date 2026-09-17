import React, { useEffect, useRef, useState } from 'react';
import { DataPoint, Dataset, Hyperparameters, TreeNode } from '../types';
import { Layers, MoveHorizontal, RefreshCw } from 'lucide-react';
import { predictSample } from '../ml/treeEngine';

interface DecisionBoundaryCanvasProps {
  dataset: Dataset;
  trainData: DataPoint[];
  testData: DataPoint[];
  rootTree?: TreeNode;
  forestPredict?: (features: number[]) => number;
  modelType: 'decision_tree' | 'random_forest';
  highlightPoint?: number[];
}

export const DecisionBoundaryCanvas: React.FC<DecisionBoundaryCanvasProps> = ({
  dataset,
  trainData,
  testData,
  rootTree,
  forestPredict,
  modelType,
  highlightPoint,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [featX, setFeatX] = useState<number>(dataset.xFeatureIdx);
  const [featY, setFeatY] = useState<number>(dataset.yFeatureIdx);
  const [showTestPoints, setShowTestPoints] = useState<boolean>(true);
  const [regressionViewMode, setRegressionViewMode] = useState<'2d_mesh' | '1d_curve'>('2d_mesh');

  const isClassification = dataset.task === 'classification';
  const numClasses = dataset.targetLabels?.length || 2;

  // Sync default feature indices when dataset changes
  useEffect(() => {
    setFeatX(dataset.xFeatureIdx);
    setFeatY(dataset.yFeatureIdx);
  }, [dataset]);

  // Color pallete for classes
  const classColorsRGB: [number, number, number][] = [
    [16, 185, 129], // Emerald
    [99, 102, 241], // Indigo
    [245, 158, 11], // Amber
    [236, 72, 153], // Pink
  ];

  const classColorsHex = ['#10b981', '#6366f1', '#f59e0b', '#ec4899'];

  // Prediction function wrapper
  const getPrediction = (features: number[]): number => {
    if (modelType === 'random_forest' && forestPredict) {
      return forestPredict(features);
    }
    if (rootTree) {
      return predictSample(rootTree, features);
    }
    return 0;
  };

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Determine feature bounds
    const allData = [...trainData, ...testData];
    if (allData.length === 0) return;

    const xVals = allData.map((d) => d.features[featX]);
    const yVals = allData.map((d) => d.features[featY]);
    const targets = allData.map((d) => d.target);

    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);
    const minY = Math.min(...yVals);
    const maxY = Math.max(...yVals);
    const minTarget = Math.min(...targets);
    const maxTarget = Math.max(...targets);

    const padX = (maxX - minX) * 0.08 || 1;
    const padY = (maxY - minY) * 0.08 || 1;

    const x0 = minX - padX;
    const x1 = maxX + padX;
    const y0 = minY - padY;
    const y1 = maxY + padY;

    // Median values for features not on the 2D plane
    const baselineFeatures = dataset.featureNames.map((_, idx) => {
      const vals = allData.map((d) => d.features[idx]).sort((a, b) => a - b);
      return vals[Math.floor(vals.length / 2)] || 0;
    });

    // Helper coordinate projections
    const toCanvasX = (val: number) => ((val - x0) / (x1 - x0)) * width;
    const toCanvasY = (val: number) => height - ((val - y0) / (y1 - y0)) * height;

    if (!isClassification && regressionViewMode === '1d_curve') {
      // 1D Step-Function / Curve view: Target vs Feature X
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Draw gridlines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let i = 1; i < 5; i++) {
        const gy = (height / 5) * i;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();

        const gx = (width / 5) * i;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }

      // Map target to Y axis
      const padT = (maxTarget - minTarget) * 0.1 || 1;
      const t0 = minTarget - padT;
      const t1 = maxTarget + padT;
      const toCanvasTargetY = (tVal: number) => height - ((tVal - t0) / (t1 - t0)) * height;

      // Draw model step curve
      const steps = 180;
      ctx.beginPath();
      ctx.strokeStyle = modelType === 'random_forest' ? '#38bdf8' : '#34d399';
      ctx.lineWidth = 3;

      for (let s = 0; s <= steps; s++) {
        const valX = x0 + (s / steps) * (x1 - x0);
        const sampleFeats = [...baselineFeatures];
        sampleFeats[featX] = valX;
        const predY = getPrediction(sampleFeats);

        const cx = toCanvasX(valX);
        const cy = toCanvasTargetY(predY);
        if (s === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
      ctx.stroke();

      // Draw Points
      allData.forEach((pt) => {
        const isTest = testData.includes(pt);
        if (isTest && !showTestPoints) return;

        const cx = toCanvasX(pt.features[featX]);
        const cy = toCanvasTargetY(pt.target);

        ctx.fillStyle = isTest ? '#f43f5e' : '#38bdf8';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        if (isTest) {
          // Diamond for test
          ctx.moveTo(cx, cy - 4);
          ctx.lineTo(cx + 4, cy);
          ctx.lineTo(cx, cy + 4);
          ctx.lineTo(cx - 4, cy);
          ctx.closePath();
        } else {
          ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.stroke();
      });

      return;
    }

    // 2D Decision Mesh / Heatmap Rendering
    const resX = 64;
    const resY = 48;
    const cellW = width / resX;
    const cellH = height / resY;

    for (let iy = 0; iy < resY; iy++) {
      const valY = y1 - (iy / resY) * (y1 - y0);
      for (let ix = 0; ix < resX; ix++) {
        const valX = x0 + (ix / resX) * (x1 - x0);

        const sampleFeatures = [...baselineFeatures];
        sampleFeatures[featX] = valX;
        sampleFeatures[featY] = valY;

        const pred = getPrediction(sampleFeatures);

        if (isClassification) {
          const color = classColorsRGB[Math.round(pred) % classColorsRGB.length] || [100, 100, 100];
          ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.22)`;
        } else {
          // Normalized regression color heat (dark blue to cyan to warm amber)
          const norm = Math.max(0, Math.min(1, (pred - minTarget) / (maxTarget - minTarget || 1)));
          const r = Math.round(20 + norm * 220);
          const g = Math.round(50 + norm * 150);
          const b = Math.round(180 - norm * 120);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.35)`;
        }

        ctx.fillRect(ix * cellW, iy * cellH, cellW + 0.5, cellH + 0.5);
      }
    }

    // Draw grid axes
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);

    // Draw Data Points
    allData.forEach((pt) => {
      const isTest = testData.includes(pt);
      if (isTest && !showTestPoints) return;

      const cx = toCanvasX(pt.features[featX]);
      const cy = toCanvasY(pt.features[featY]);

      if (isClassification) {
        ctx.fillStyle = classColorsHex[pt.target % classColorsHex.length] || '#ffffff';
      } else {
        const norm = Math.max(0, Math.min(1, (pt.target - minTarget) / (maxTarget - minTarget || 1)));
        ctx.fillStyle = `rgb(${Math.round(40 + norm * 200)}, ${Math.round(80 + norm * 130)}, ${Math.round(220 - norm * 160)})`;
      }

      ctx.strokeStyle = isTest ? '#ffffff' : '#020617';
      ctx.lineWidth = isTest ? 2 : 1;

      ctx.beginPath();
      if (isTest) {
        // Diamond for test
        ctx.moveTo(cx, cy - 4.5);
        ctx.lineTo(cx + 4.5, cy);
        ctx.lineTo(cx, cy + 4.5);
        ctx.lineTo(cx - 4.5, cy);
        ctx.closePath();
      } else {
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();
    });

    // Highlight user test point if passed
    if (highlightPoint && highlightPoint.length >= 2) {
      const hx = toCanvasX(highlightPoint[featX]);
      const hy = toCanvasY(highlightPoint[featY]);

      ctx.save();
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2.5;
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(hx, hy, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(hx, hy, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, [
    dataset,
    trainData,
    testData,
    rootTree,
    forestPredict,
    modelType,
    featX,
    featY,
    showTestPoints,
    regressionViewMode,
    highlightPoint,
  ]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
      {/* Visualizer Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-100">
            {isClassification ? 'Fronteras de Decisión en 2D' : 'Espacio de Regresión & Curva'}
          </h3>
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {modelType === 'decision_tree'
              ? 'Árbol: Cortes Ortogonales'
              : 'Random Forest: Frontera Suavizada'}
          </span>
        </div>

        {/* Dimension & View Controls */}
        <div className="flex items-center gap-3 text-xs flex-wrap">
          {!isClassification && (
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded border border-slate-700">
              <button
                onClick={() => setRegressionViewMode('2d_mesh')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  regressionViewMode === '2d_mesh'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Malla 2D
              </button>
              <button
                onClick={() => setRegressionViewMode('1d_curve')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  regressionViewMode === '1d_curve'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Curva Escalón 1D
              </button>
            </div>
          )}

          {/* Feature X Select */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px]">Eje X:</span>
            <select
              value={featX}
              onChange={(e) => setFeatX(Number(e.target.value))}
              className="bg-slate-800 text-slate-200 rounded px-2 py-1 text-xs border border-slate-700"
            >
              {dataset.featureNames.map((name, idx) => (
                <option key={idx} value={idx}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Feature Y Select */}
          {regressionViewMode !== '1d_curve' && (
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[11px]">Eje Y:</span>
              <select
                value={featY}
                onChange={(e) => setFeatY(Number(e.target.value))}
                className="bg-slate-800 text-slate-200 rounded px-2 py-1 text-xs border border-slate-700"
              >
                {dataset.featureNames.map((name, idx) => (
                  <option key={idx} value={idx}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Toggle Test Points */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-slate-300">
            <input
              type="checkbox"
              checked={showTestPoints}
              onChange={(e) => setShowTestPoints(e.target.checked)}
              className="rounded accent-emerald-500"
            />
            <span>Ver Datos de Test (◇)</span>
          </label>
        </div>
      </div>

      {/* Canvas Box */}
      <div ref={containerRef} className="relative w-full aspect-[16/10] max-h-[380px] bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={640}
          height={400}
          className="w-full h-full object-cover"
        />

        {/* Labels Overlay */}
        <div className="absolute top-2 left-3 bg-slate-900/80 backdrop-blur-sm border border-slate-800 px-2.5 py-1 rounded text-[11px] text-slate-300">
          {regressionViewMode === '1d_curve' && !isClassification ? (
            <span>
              Target ({dataset.targetName}) vs {dataset.featureNames[featX]}
            </span>
          ) : (
            <span>
              {dataset.featureNames[featY]} vs {dataset.featureNames[featX]}
            </span>
          )}
        </div>
      </div>

      {/* Legend & Didactic Annotation */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-1 border-t border-slate-800/80">
        <div className="flex items-center gap-3 flex-wrap">
          {isClassification ? (
            dataset.targetLabels?.map((label, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: classColorsHex[idx % classColorsHex.length] }}
                />
                <span className="text-slate-300 font-medium">{label}</span>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Escala Predicción:</span>
              <div className="w-24 h-2 rounded bg-gradient-to-r from-blue-600 via-teal-500 to-amber-500" />
              <span className="text-[10px] text-slate-400">Bajo → Alto</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 border border-slate-950 inline-block" />
            <span>Entrenamiento</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rotate-45 bg-slate-400 border border-white inline-block" />
            <span>Prueba (Test)</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 italic">
          {modelType === 'decision_tree'
            ? 'Nota pedagógica: Los árboles dividen el espacio en rectángulos paralelos a los ejes.'
            : 'Nota pedagógica: Random Forest promedia múltiples árboles, produciendo fronteras curvas y robustas.'}
        </p>
      </div>
    </div>
  );
};
