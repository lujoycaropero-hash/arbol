import { CVResult, DataPoint, Dataset, GridSearchCell, GridSearchResult, Hyperparameters } from '../types';
import { trainRandomForest } from './randomForestEngine';
import { buildTree, evaluateModel, getTreeStats, predictSample } from './treeEngine';

// Generate K-Fold split indices
export function createKFolds(data: DataPoint[], k: number): { trainIndices: number[]; valIndices: number[] }[] {
  const n = data.length;
  const indices = Array.from({ length: n }, (_, i) => i);
  // Deterministic shuffle using a simple pseudo-random sequence
  const shuffled = [...indices].sort((a, b) => ((a * 997 + b * 31) % 17) - 8);

  const foldSizes = new Array(k).fill(Math.floor(n / k));
  const remainder = n % k;
  for (let i = 0; i < remainder; i++) foldSizes[i]++;

  const folds: { trainIndices: number[]; valIndices: number[] }[] = [];
  let currentStart = 0;

  for (let f = 0; f < k; f++) {
    const size = foldSizes[f];
    const valIndices = shuffled.slice(currentStart, currentStart + size);
    const trainIndices = [...shuffled.slice(0, currentStart), ...shuffled.slice(currentStart + size)];
    folds.push({ trainIndices, valIndices });
    currentStart += size;
  }

  return folds;
}

// Run K-Fold Cross Validation for a specific hyperparameter configuration
export function runKFoldCV(
  modelType: 'decision_tree' | 'random_forest',
  dataset: Dataset,
  data: DataPoint[],
  params: Hyperparameters,
  k = 5
): CVResult {
  const folds = createKFolds(data, k);
  const foldResults = folds.map((fold, idx) => {
    const trainSubset = fold.trainIndices.map((i) => data[i]);
    const valSubset = fold.valIndices.map((i) => data[i]);

    let predictFn: (features: number[]) => number;

    if (modelType === 'decision_tree') {
      const root = buildTree(trainSubset, Array.from({ length: trainSubset.length }, (_, i) => i), 0, params, dataset);
      predictFn = (features) => predictSample(root, features);
    } else {
      const forest = trainRandomForest(dataset, trainSubset, valSubset, params);
      predictFn = forest.predict;
    }

    const dummyStats = { maxDepth: 0, nodeCount: 0, leafCount: 0 };
    const evalMetrics = evaluateModel(predictFn, trainSubset, valSubset, dataset, dummyStats, 0);

    return {
      foldIndex: idx + 1,
      trainIndices: fold.trainIndices,
      valIndices: fold.valIndices,
      trainScore: evalMetrics.trainScore,
      valScore: evalMetrics.testScore, // testScore in evaluateModel represents validation subset
    };
  });

  const valScores = foldResults.map((f) => f.valScore);
  const trainScores = foldResults.map((f) => f.trainScore);

  const meanVal = valScores.reduce((a, b) => a + b, 0) / k;
  const stdVal = Math.sqrt(valScores.reduce((sum, s) => sum + (s - meanVal) ** 2, 0) / k);
  const meanTrain = trainScores.reduce((a, b) => a + b, 0) / k;

  return {
    k,
    folds: foldResults,
    meanValScore: +meanVal.toFixed(4),
    stdValScore: +stdVal.toFixed(4),
    meanTrainScore: +meanTrain.toFixed(4),
  };
}

// Run Grid Search (Simulating GridSearchCV from Scikit-Learn)
export async function runGridSearch(
  modelType: 'decision_tree' | 'random_forest',
  dataset: Dataset,
  data: DataPoint[],
  paramGrid: {
    maxDepth: number[];
    minSamplesSplit: number[];
    minSamplesLeaf: number[];
    nEstimators?: number[];
  },
  kFolds = 5,
  onProgress?: (cell: GridSearchCell, progressPercent: number) => void
): Promise<GridSearchResult> {
  const evaluatedCells: GridSearchCell[] = [];
  const baseParams: Hyperparameters = {
    maxDepth: 3,
    minSamplesSplit: 2,
    minSamplesLeaf: 1,
    criterion: dataset.task === 'classification' ? 'gini' : 'squared_error',
    nEstimators: modelType === 'random_forest' ? 25 : undefined,
  };

  const combinations: Hyperparameters[] = [];

  for (const depth of paramGrid.maxDepth) {
    for (const split of paramGrid.minSamplesSplit) {
      for (const leaf of paramGrid.minSamplesLeaf) {
        if (modelType === 'random_forest' && paramGrid.nEstimators && paramGrid.nEstimators.length > 0) {
          for (const nest of paramGrid.nEstimators) {
            combinations.push({
              ...baseParams,
              maxDepth: depth,
              minSamplesSplit: split,
              minSamplesLeaf: leaf,
              nEstimators: nest,
            });
          }
        } else {
          combinations.push({
            ...baseParams,
            maxDepth: depth,
            minSamplesSplit: split,
            minSamplesLeaf: leaf,
          });
        }
      }
    }
  }

  const total = combinations.length;
  let bestScore = -Infinity;
  let bestParams = combinations[0];

  for (let i = 0; i < total; i++) {
    const p = combinations[i];
    const cv = runKFoldCV(modelType, dataset, data, p, kFolds);

    const cell: GridSearchCell = {
      id: `grid_${p.maxDepth}_${p.minSamplesSplit}_${p.minSamplesLeaf}_${p.nEstimators || 0}`,
      params: { ...p },
      meanScore: cv.meanValScore,
      stdScore: cv.stdValScore,
      trainMeanScore: cv.meanTrainScore,
      foldScores: cv.folds.map((f) => f.valScore),
    };

    if (cv.meanValScore > bestScore) {
      bestScore = cv.meanValScore;
      bestParams = p;
    }

    evaluatedCells.push(cell);

    if (onProgress) {
      onProgress(cell, Math.round(((i + 1) / total) * 100));
      // Give a tiny yield to UI thread
      if (i % 3 === 0) {
        await new Promise((r) => setTimeout(r, 16));
      }
    }
  }

  // Mark best cell
  evaluatedCells.forEach((c) => {
    if (
      c.params.maxDepth === bestParams.maxDepth &&
      c.params.minSamplesSplit === bestParams.minSamplesSplit &&
      c.params.minSamplesLeaf === bestParams.minSamplesLeaf &&
      (!bestParams.nEstimators || c.params.nEstimators === bestParams.nEstimators)
    ) {
      c.isBest = true;
    }
  });

  return {
    timestamp: Date.now(),
    totalCombinations: total,
    kFolds,
    evaluatedCells,
    bestParams,
    bestScore,
  };
}
