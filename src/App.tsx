import React, { useMemo, useState } from 'react';
import { ALL_DATASETS } from './data/datasets';
import {
  DataPoint,
  Dataset,
  Hyperparameters,
  ModelComparisonResult,
  TreeNode,
} from './types';
import { buildTree, evaluateModel, getTreeStats, predictSample } from './ml/treeEngine';
import { trainRandomForest, ForestEnsemble } from './ml/randomForestEngine';
import { Navbar } from './components/Navbar';
import { DatasetViewer } from './components/DatasetViewer';
import { HyperparameterPanel } from './components/HyperparameterPanel';
import { TreeVisualizer } from './components/TreeVisualizer';
import { DecisionBoundaryCanvas } from './components/DecisionBoundaryCanvas';
import { CrossValidationView } from './components/CrossValidationView';
import { GridSearchLab } from './components/GridSearchLab';
import { ModelComparisonView } from './components/ModelComparisonView';
import { InteractivePredictor } from './components/InteractivePredictor';
import { ScikitLearnCodeModal } from './components/ScikitLearnCodeModal';
import { PedagogicalGuide } from './components/PedagogicalGuide';

export default function App() {
  const [currentDataset, setCurrentDataset] = useState<Dataset>(ALL_DATASETS[0]);
  const [modelType, setModelType] = useState<'decision_tree' | 'random_forest'>('decision_tree');

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'visualizer' | 'gridsearch' | 'comparison' | 'predictor' | 'cv_breakdown'
  >('visualizer');

  // Modals state
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);

  // Split dataset into deterministic Train (75%) and Test (25%)
  const { trainData, testData } = useMemo(() => {
    const data = currentDataset.data;
    const trainCount = Math.floor(data.length * currentDataset.trainRatio);
    // Deterministic split
    const train = data.slice(0, trainCount);
    const test = data.slice(trainCount);
    return { trainData: train, testData: test };
  }, [currentDataset]);

  // Current Active Hyperparameters
  const [params, setParams] = useState<Hyperparameters>({
    maxDepth: 3,
    minSamplesSplit: 4,
    minSamplesLeaf: 2,
    criterion: currentDataset.task === 'classification' ? 'gini' : 'squared_error',
    nEstimators: 25,
    maxFeaturesRatio: 0.5,
  });

  // When dataset changes, ensure criterion matches task
  const handleDatasetChange = (newDs: Dataset) => {
    setCurrentDataset(newDs);
    setParams((p) => ({
      ...p,
      criterion: newDs.task === 'classification' ? 'gini' : 'squared_error',
    }));
  };

  // Build active Single Tree
  const { rootTree, treeMetrics } = useMemo(() => {
    const t0 = performance.now();
    const tree = buildTree(
      trainData,
      Array.from({ length: trainData.length }, (_, i) => i),
      0,
      params,
      currentDataset
    );
    const timeMs = Math.round(performance.now() - t0);
    const stats = getTreeStats(tree);
    const metrics = evaluateModel(
      (feats) => predictSample(tree, feats),
      trainData,
      testData,
      currentDataset,
      stats,
      timeMs
    );
    return { rootTree: tree, treeMetrics: metrics };
  }, [trainData, testData, params, currentDataset]);

  // Train active Random Forest
  const forest: ForestEnsemble = useMemo(() => {
    return trainRandomForest(currentDataset, trainData, testData, params);
  }, [currentDataset, trainData, testData, params]);

  // Active metrics depending on selected modelType
  const activeMetrics = modelType === 'decision_tree' ? treeMetrics : forest.metrics;

  // 4 Model Comparison benchmark calculations
  const comparisonModels: ModelComparisonResult[] = useMemo(() => {
    const isCls = currentDataset.task === 'classification';
    const baseCriterion = isCls ? 'gini' : 'squared_error';

    // 1. Decision Tree Base (unpruned/high depth)
    const dtBaseParams: Hyperparameters = {
      maxDepth: 8,
      minSamplesSplit: 2,
      minSamplesLeaf: 1,
      criterion: baseCriterion,
    };
    const t0 = performance.now();
    const dtBaseTree = buildTree(
      trainData,
      Array.from({ length: trainData.length }, (_, i) => i),
      0,
      dtBaseParams,
      currentDataset
    );
    const dtBaseStats = getTreeStats(dtBaseTree);
    const dtBaseMetrics = evaluateModel(
      (feats) => predictSample(dtBaseTree, feats),
      trainData,
      testData,
      currentDataset,
      dtBaseStats,
      Math.round(performance.now() - t0)
    );

    // 2. Decision Tree Tuned (pruned / optimal)
    const dtTunedParams: Hyperparameters = {
      maxDepth: 3,
      minSamplesSplit: 6,
      minSamplesLeaf: 3,
      criterion: baseCriterion,
    };
    const dtTunedTree = buildTree(
      trainData,
      Array.from({ length: trainData.length }, (_, i) => i),
      0,
      dtTunedParams,
      currentDataset
    );
    const dtTunedStats = getTreeStats(dtTunedTree);
    const dtTunedMetrics = evaluateModel(
      (feats) => predictSample(dtTunedTree, feats),
      trainData,
      testData,
      currentDataset,
      dtTunedStats,
      1
    );

    // 3. Random Forest Base
    const rfBaseParams: Hyperparameters = {
      maxDepth: 8,
      minSamplesSplit: 2,
      minSamplesLeaf: 1,
      nEstimators: 15,
      criterion: baseCriterion,
    };
    const rfBaseForest = trainRandomForest(currentDataset, trainData, testData, rfBaseParams);

    // 4. Random Forest Tuned (Ensemble with regularized trees)
    const rfTunedParams: Hyperparameters = {
      maxDepth: 4,
      minSamplesSplit: 4,
      minSamplesLeaf: 2,
      nEstimators: 35,
      criterion: baseCriterion,
    };
    const rfTunedForest = trainRandomForest(currentDataset, trainData, testData, rfTunedParams);

    return [
      {
        id: 'dt_base',
        name: 'Árbol Base (Sin Poda)',
        modelType: 'decision_tree',
        isTuned: false,
        params: dtBaseParams,
        metrics: dtBaseMetrics,
        featureImportances: [],
      },
      {
        id: 'dt_tuned',
        name: 'Árbol Optimizado',
        modelType: 'decision_tree',
        isTuned: true,
        params: dtTunedParams,
        metrics: dtTunedMetrics,
        featureImportances: [],
      },
      {
        id: 'rf_base',
        name: 'Random Forest Base',
        modelType: 'random_forest',
        isTuned: false,
        params: rfBaseParams,
        metrics: rfBaseForest.metrics,
        featureImportances: rfBaseForest.featureImportances,
      },
      {
        id: 'rf_tuned',
        name: 'Random Forest Optimizado',
        modelType: 'random_forest',
        isTuned: true,
        params: rfTunedParams,
        metrics: rfTunedForest.metrics,
        featureImportances: rfTunedForest.featureImportances,
      },
    ];
  }, [currentDataset, trainData, testData]);

  // Interactive Predictor Highlight States
  const [highlightPoint, setHighlightPoint] = useState<number[] | undefined>(undefined);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string>>(new Set());

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation Bar */}
      <Navbar
        currentDataset={currentDataset}
        onSelectDataset={handleDatasetChange}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenCodeModal={() => setIsCodeModalOpen(true)}
        onOpenGuideModal={() => setIsGuideModalOpen(true)}
        modelType={modelType}
        onChangeModelType={setModelType}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Dataset Header Info Card */}
        <DatasetViewer dataset={currentDataset} />

        {/* Tab 1: Visualizer & Live Tuning */}
        {activeTab === 'visualizer' && (
          <div className="space-y-6 animate-fade-in">
            {/* Hyperparameters Controls */}
            <HyperparameterPanel
              dataset={currentDataset}
              params={params}
              onChangeParams={setParams}
              metrics={activeMetrics}
              modelType={modelType}
            />

            {/* Visual Canvas & Tree Structure Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Decision Boundary / Regression Curve (5 cols) */}
              <div className="lg:col-span-5">
                <DecisionBoundaryCanvas
                  dataset={currentDataset}
                  trainData={trainData}
                  testData={testData}
                  rootTree={rootTree}
                  forestPredict={forest.predict}
                  modelType={modelType}
                  highlightPoint={highlightPoint}
                />
              </div>

              {/* Tree Hierarchical Visualizer (7 cols) */}
              <div className="lg:col-span-7">
                <TreeVisualizer
                  root={modelType === 'decision_tree' ? rootTree : forest.trees[0]}
                  dataset={currentDataset}
                  highlightedNodeIds={highlightedNodeIds}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: K-Fold Cross Validation Simulator */}
        {activeTab === 'cv_breakdown' && (
          <div className="animate-fade-in">
            <CrossValidationView
              dataset={currentDataset}
              data={currentDataset.data}
              params={params}
              modelType={modelType}
            />
          </div>
        )}

        {/* Tab 3: GridSearchCV Lab */}
        {activeTab === 'gridsearch' && (
          <div className="animate-fade-in">
            <GridSearchLab
              dataset={currentDataset}
              data={currentDataset.data}
              modelType={modelType}
              onApplyBestParams={(bestParams) => {
                setParams(bestParams);
                setActiveTab('visualizer');
              }}
            />
          </div>
        )}

        {/* Tab 4: 4-Way Model Comparison */}
        {activeTab === 'comparison' && (
          <div className="animate-fade-in">
            <ModelComparisonView
              dataset={currentDataset}
              comparisonModels={comparisonModels}
              onSelectModelParams={(model) => {
                setParams(model.params);
                setModelType(model.modelType);
                setActiveTab('visualizer');
              }}
            />
          </div>
        )}

        {/* Tab 5: Live Interactive Predictor (What-If) */}
        {activeTab === 'predictor' && (
          <div className="space-y-6 animate-fade-in">
            <InteractivePredictor
              dataset={currentDataset}
              rootTree={rootTree}
              forest={forest}
              onUpdateHighlightPoint={(pt) => setHighlightPoint(pt)}
              onUpdateHighlightedNodes={(nodes) => setHighlightedNodeIds(nodes)}
            />

            {/* Also show the 2D canvas with the highlighted test point */}
            <DecisionBoundaryCanvas
              dataset={currentDataset}
              trainData={trainData}
              testData={testData}
              rootTree={rootTree}
              forestPredict={forest.predict}
              modelType={modelType}
              highlightPoint={highlightPoint}
            />
          </div>
        )}
      </main>

      {/* Scikit-Learn Python Code Modal */}
      <ScikitLearnCodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        dataset={currentDataset}
        params={params}
        modelType={modelType}
      />

      {/* Pedagogical Interactive Guide Modal */}
      <PedagogicalGuide
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        ML Tree Lab • Laboratorio didáctico de Árboles de Decisión, Regresión y Random Forest con Scikit-Learn • Optimización con Validación Cruzada & GridSearchCV
      </footer>
    </div>
  );
}
