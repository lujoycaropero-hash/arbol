import React, { useState } from 'react';
import { Dataset, TreeNode } from '../types';
import { GitFork, Info, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface TreeVisualizerProps {
  root: TreeNode;
  dataset: Dataset;
  highlightedNodeIds?: Set<string>;
}

interface NodeLayout {
  node: TreeNode;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const TreeVisualizer: React.FC<TreeVisualizerProps> = ({
  root,
  dataset,
  highlightedNodeIds = new Set(),
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [maxDisplayDepth, setMaxDisplayDepth] = useState<number>(4);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

  const isClassification = dataset.task === 'classification';

  // Compute node coordinates recursively for hierarchical layout
  const nodeWidth = 160;
  const nodeHeight = 84;
  const levelGap = 80;

  // Calculate layout bounds
  let minX = 0;
  let maxX = 800;
  let maxY = 400;

  const layouts: NodeLayout[] = [];
  const links: { x1: number; y1: number; x2: number; y2: number; label: string; isHighlighted: boolean }[] = [];

  // Helper to count leaves for sub-tree width allocation
  function getSubtreeLeaves(node: TreeNode, depth: number): number {
    if (node.isLeaf || depth >= maxDisplayDepth || (!node.left && !node.right)) {
      return 1;
    }
    const leftLeaves = node.left ? getSubtreeLeaves(node.left, depth + 1) : 0;
    const rightLeaves = node.right ? getSubtreeLeaves(node.right, depth + 1) : 0;
    return Math.max(1, leftLeaves + rightLeaves);
  }

  function assignPositions(node: TreeNode, depth: number, leftBound: number, rightBound: number) {
    if (depth > maxDisplayDepth) return;

    const x = (leftBound + rightBound) / 2;
    const y = 30 + depth * (nodeHeight + levelGap);

    layouts.push({ node, x, y, width: nodeWidth, height: nodeHeight });

    if (x - nodeWidth / 2 < minX) minX = x - nodeWidth / 2;
    if (x + nodeWidth / 2 > maxX) maxX = x + nodeWidth / 2;
    if (y + nodeHeight > maxY) maxY = y + nodeHeight;

    if (!node.isLeaf && depth < maxDisplayDepth) {
      const leftLeaves = node.left ? getSubtreeLeaves(node.left, depth + 1) : 1;
      const rightLeaves = node.right ? getSubtreeLeaves(node.right, depth + 1) : 1;
      const totalLeaves = leftLeaves + rightLeaves;

      const splitPoint = leftBound + (rightBound - leftBound) * (leftLeaves / totalLeaves);

      if (node.left) {
        const leftX = (leftBound + splitPoint) / 2;
        const leftY = 30 + (depth + 1) * (nodeHeight + levelGap);
        const isPath = highlightedNodeIds.has(node.id) && highlightedNodeIds.has(node.left.id);
        links.push({
          x1: x,
          y1: y + nodeHeight,
          x2: leftX,
          y2: leftY,
          label: 'Sí (≤)',
          isHighlighted: isPath,
        });
        assignPositions(node.left, depth + 1, leftBound, splitPoint);
      }

      if (node.right) {
        const rightX = (splitPoint + rightBound) / 2;
        const rightY = 30 + (depth + 1) * (nodeHeight + levelGap);
        const isPath = highlightedNodeIds.has(node.id) && highlightedNodeIds.has(node.right.id);
        links.push({
          x1: x,
          y1: y + nodeHeight,
          x2: rightX,
          y2: rightY,
          label: 'No (>)',
          isHighlighted: isPath,
        });
        assignPositions(node.right, depth + 1, splitPoint, rightBound);
      }
    }
  }

  const rootLeaves = getSubtreeLeaves(root, 0);
  const totalCanvasWidth = Math.max(860, rootLeaves * 180);
  assignPositions(root, 0, 40, totalCanvasWidth - 40);

  const svgWidth = Math.max(900, totalCanvasWidth + 60);
  const svgHeight = Math.max(480, maxY + 60);

  // Palette for classes
  const classColors = ['#10b981', '#6366f1', '#f59e0b', '#ec4899'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col space-y-3">
      {/* Visualizer Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <GitFork className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-100">
            Estructura Jerárquica del Árbol de Decisión
          </h3>
          <span className="text-xs text-slate-400">
            ({isClassification ? 'Particiones Ortogonales' : 'Regresión por Regiones'})
          </span>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Profundidad Visible:</span>
            <select
              value={maxDisplayDepth}
              onChange={(e) => setMaxDisplayDepth(Number(e.target.value))}
              className="bg-slate-800 text-slate-200 rounded px-2 py-1 border border-slate-700 focus:outline-none"
            >
              <option value={2}>Nivel 2</option>
              <option value={3}>Nivel 3</option>
              <option value={4}>Nivel 4</option>
              <option value={6}>Todos (Nivel 6)</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded border border-slate-700">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.15))}
              className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700"
              title="Alejar"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1 text-slate-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.15))}
              className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700"
              title="Acercar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700"
              title="Restablecer Zoom"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full h-[460px] bg-slate-950/70 border border-slate-800/80 rounded-lg overflow-auto scrollbar-thin">
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            width: `${svgWidth}px`,
            height: `${svgHeight}px`,
            transition: 'transform 0.15s ease-out',
          }}
          className="relative"
        >
          {/* SVG Links */}
          <svg className="absolute inset-0 pointer-events-none" width={svgWidth} height={svgHeight}>
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
              </marker>
              <marker
                id="arrow-active"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
              </marker>
            </defs>
            {links.map((link, i) => (
              <g key={`link_${i}`}>
                {/* Curved Connector */}
                <path
                  d={`M ${link.x1} ${link.y1} C ${link.x1} ${(link.y1 + link.y2) / 2}, ${link.x2} ${
                    (link.y1 + link.y2) / 2
                  }, ${link.x2} ${link.y2}`}
                  fill="none"
                  stroke={link.isHighlighted ? '#10b981' : '#475569'}
                  strokeWidth={link.isHighlighted ? 3 : 1.5}
                  strokeDasharray={link.isHighlighted ? 'none' : 'none'}
                />
                {/* Link Condition Tag */}
                <rect
                  x={(link.x1 + link.x2) / 2 - 20}
                  y={(link.y1 + link.y2) / 2 - 9}
                  width="40"
                  height="18"
                  rx="4"
                  fill="#0f172a"
                  stroke={link.isHighlighted ? '#10b981' : '#334155'}
                  strokeWidth="1"
                />
                <text
                  x={(link.x1 + link.x2) / 2}
                  y={(link.y1 + link.y2) / 2 + 3}
                  textAnchor="middle"
                  fill={link.isHighlighted ? '#34d399' : '#94a3b8'}
                  fontSize="10"
                  fontWeight="600"
                >
                  {link.label}
                </text>
              </g>
            ))}
          </svg>

          {/* Render HTML Nodes */}
          {layouts.map(({ node, x, y, width, height }) => {
            const isHighlighted = highlightedNodeIds.has(node.id);
            const isSelected = selectedNode?.id === node.id;

            return (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node)}
                style={{
                  left: `${x - width / 2}px`,
                  top: `${y}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                }}
                className={`absolute rounded-lg p-2 flex flex-col justify-between cursor-pointer transition-all select-none border text-xs ${
                  isHighlighted
                    ? 'ring-2 ring-emerald-400 border-emerald-500 bg-emerald-950/80 text-white shadow-lg shadow-emerald-900/30'
                    : isSelected
                    ? 'ring-2 ring-indigo-400 border-indigo-500 bg-slate-850 bg-slate-800 text-white'
                    : node.isLeaf
                    ? 'bg-slate-900/95 border-emerald-500/40 text-slate-200 hover:border-emerald-400 hover:bg-slate-800'
                    : 'bg-slate-900/95 border-slate-700 text-slate-200 hover:border-slate-500 hover:bg-slate-800'
                }`}
              >
                {/* Node Title / Condition */}
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-1">
                  <span className="font-semibold truncate text-[11px] text-slate-100">
                    {node.isLeaf ? (
                      <span className="text-emerald-400 font-bold">🌿 Hoja</span>
                    ) : (
                      `${node.featureName} ≤ ${node.threshold}`
                    )}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 px-1 rounded bg-slate-800">
                    d:{node.depth}
                  </span>
                </div>

                {/* Node Metrics */}
                <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300 my-0.5">
                  <div>
                    <span className="text-slate-500 text-[9px]">
                      {isClassification ? 'Gini: ' : 'MSE: '}
                    </span>
                    <span className="font-mono">{node.impurity}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[9px]">n: </span>
                    <span className="font-mono font-medium">{node.samples}</span>
                  </div>
                </div>

                {/* Bottom Distribution Bar or Prediction */}
                {isClassification ? (
                  <div className="space-y-0.5">
                    <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-slate-800">
                      {node.value.map((cnt, cIdx) => {
                        const pct = node.samples > 0 ? (cnt / node.samples) * 100 : 0;
                        return (
                          <div
                            key={cIdx}
                            style={{
                              width: `${pct}%`,
                              backgroundColor: classColors[cIdx % classColors.length],
                            }}
                            title={`Clase ${dataset.targetLabels?.[cIdx] || cIdx}: ${cnt} muestras (${pct.toFixed(0)}%)`}
                          />
                        );
                      })}
                    </div>
                    <div className="text-[10px] truncate text-slate-300 font-medium">
                      Pred: <span className="text-emerald-400">{node.predictionLabel}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] truncate text-slate-300 font-medium">
                    Pred: <span className="text-amber-400 font-mono">{node.prediction}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Node Inspector Footer */}
      {selectedNode && (
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-200">
              Detalle del Nodo ({selectedNode.id}):
            </span>
            <span className="text-slate-300">
              {selectedNode.isLeaf
                ? `Hoja final -> Predicción: ${selectedNode.predictionLabel}`
                : `Condición: ${selectedNode.featureName} ≤ ${selectedNode.threshold}`}
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>Muestras: {selectedNode.samples}</span>
            <span>Impureza: {selectedNode.impurity}</span>
            <span>Profundidad: {selectedNode.depth}</span>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-xs text-slate-400 hover:text-white underline ml-2"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
