import { DataPoint, Dataset, Hyperparameters, ModelMetrics, TreeNode } from '../types';
import { buildTree, evaluateModel, getTreeStats, predictSample } from './treeEngine';

export interface ForestEnsemble {
  trees: TreeNode[];
  nEstimators: number;
  featureImportances: { name: string; importance: number }[];
  predict: (features: number[]) => number;
  predictAllVotes: (features: number[]) => number[];
  metrics: ModelMetrics;
  avgDepth: number;
}

// Generate bootstrap sample indices (sample with replacement)
export function generateBootstrapIndices(n: number): { train: number[]; oob: number[] } {
  const train: number[] = [];
  const picked = new Set<number>();
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * n);
    train.push(idx);
    picked.add(idx);
  }
  const oob: number[] = [];
  for (let i = 0; i < n; i++) {
    if (!picked.has(i)) oob.push(i);
  }
  return { train, oob };
}

export function trainRandomForest(
  dataset: Dataset,
  trainData: DataPoint[],
  testData: DataPoint[],
  params: Hyperparameters
): ForestEnsemble {
  const startTime = performance.now();
  const nEstimators = params.nEstimators || 20;
  const isClassification = dataset.task === 'classification';
  const numFeatures = dataset.featureNames.length;

  // Default maxFeatures: sqrt(p) for classification, p/3 (or 0.6) for regression
  const featureSubsetRatio =
    params.maxFeaturesRatio ||
    (isClassification ? Math.sqrt(numFeatures) / numFeatures : Math.max(0.4, 1 / 3));

  const trees: TreeNode[] = [];
  const featureImportanceAcc = new Array(numFeatures).fill(0);
  let totalNodes = 0;
  let totalLeaves = 0;
  let totalDepth = 0;

  for (let t = 0; t < nEstimators; t++) {
    const { train: bootIndices } = generateBootstrapIndices(trainData.length);
    const treeImportance = new Array(numFeatures).fill(0);

    const root = buildTree(
      trainData,
      bootIndices,
      0,
      params,
      dataset,
      featureSubsetRatio,
      { count: 0 },
      treeImportance
    );

    // Normalize tree importance and accumulate
    const sumImp = treeImportance.reduce((a, b) => a + b, 0) || 1;
    for (let f = 0; f < numFeatures; f++) {
      featureImportanceAcc[f] += treeImportance[f] / sumImp;
    }

    const stats = getTreeStats(root);
    totalNodes += stats.nodeCount;
    totalLeaves += stats.leafCount;
    totalDepth += stats.maxDepth;

    trees.push(root);
  }

  // Final feature importances normalized to 100%
  const totalImp = featureImportanceAcc.reduce((a, b) => a + b, 0) || 1;
  const featureImportances = dataset.featureNames.map((name, idx) => ({
    name,
    importance: +( (featureImportanceAcc[idx] / totalImp) * 100 ).toFixed(1),
  })).sort((a, b) => b.importance - a.importance);

  const predictAllVotes = (features: number[]): number[] => {
    return trees.map((tree) => predictSample(tree, features));
  };

  const predict = (features: number[]): number => {
    const votes = predictAllVotes(features);
    if (isClassification) {
      // Majority voting
      const counts: Record<number, number> = {};
      let maxV = -1;
      let winningClass = votes[0];
      for (const v of votes) {
        counts[v] = (counts[v] || 0) + 1;
        if (counts[v] > maxV) {
          maxV = counts[v];
          winningClass = v;
        }
      }
      return winningClass;
    } else {
      // Average prediction
      const sum = votes.reduce((a, b) => a + b, 0);
      return +(sum / votes.length).toFixed(2);
    }
  };

  const trainingTimeMs = Math.round(performance.now() - startTime);

  const avgTreeStats = {
    maxDepth: +(totalDepth / nEstimators).toFixed(1) as unknown as number,
    nodeCount: Math.round(totalNodes / nEstimators),
    leafCount: Math.round(totalLeaves / nEstimators),
  };

  const metrics = evaluateModel(predict, trainData, testData, dataset, avgTreeStats, trainingTimeMs);

  return {
    trees,
    nEstimators,
    featureImportances,
    predict,
    predictAllVotes,
    metrics,
    avgDepth: avgTreeStats.maxDepth,
  };
}
