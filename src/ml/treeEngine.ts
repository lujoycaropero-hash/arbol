import { DataPoint, Dataset, Hyperparameters, ModelMetrics, TreeNode } from '../types';

// Compute Gini Impurity: 1 - sum(p_i^2)
export function computeGini(targets: number[], numClasses: number): number {
  if (targets.length === 0) return 0;
  const counts = new Array(numClasses).fill(0);
  for (const t of targets) counts[t]++;
  let sumSq = 0;
  for (let i = 0; i < numClasses; i++) {
    const p = counts[i] / targets.length;
    sumSq += p * p;
  }
  return 1 - sumSq;
}

// Compute Shannon Entropy: - sum(p_i * log2(p_i))
export function computeEntropy(targets: number[], numClasses: number): number {
  if (targets.length === 0) return 0;
  const counts = new Array(numClasses).fill(0);
  for (const t of targets) counts[t]++;
  let ent = 0;
  for (let i = 0; i < numClasses; i++) {
    if (counts[i] > 0) {
      const p = counts[i] / targets.length;
      ent -= p * Math.log2(p);
    }
  }
  return ent;
}

// Compute Variance / Mean Squared Error for regression
export function computeVariance(targets: number[]): number {
  if (targets.length === 0) return 0;
  const mean = targets.reduce((a, b) => a + b, 0) / targets.length;
  let ssq = 0;
  for (const t of targets) {
    const diff = t - mean;
    ssq += diff * diff;
  }
  return ssq / targets.length;
}

// Compute Mean Absolute Deviation for regression
export function computeMAD(targets: number[]): number {
  if (targets.length === 0) return 0;
  const sorted = [...targets].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  let absSum = 0;
  for (const t of targets) {
    absSum += Math.abs(t - median);
  }
  return absSum / targets.length;
}

// Calculate impurity according to task and criterion
export function calculateImpurity(
  targets: number[],
  isClassification: boolean,
  criterion: string,
  numClasses: number
): number {
  if (isClassification) {
    return criterion === 'entropy' ? computeEntropy(targets, numClasses) : computeGini(targets, numClasses);
  } else {
    return criterion === 'absolute_error' ? computeMAD(targets) : computeVariance(targets);
  }
}

export interface SplitResult {
  featureIdx: number;
  threshold: number;
  impurity: number;
  gain: number;
  leftIndices: number[];
  rightIndices: number[];
}

// Find the best split among allowed features and candidate thresholds
export function findBestSplit(
  data: DataPoint[],
  indices: number[],
  allowedFeatureIndices: number[],
  isClassification: boolean,
  criterion: string,
  numClasses: number,
  minSamplesLeaf: number
): SplitResult | null {
  const n = indices.length;
  if (n < 2) return null;

  const currentTargets = indices.map((idx) => data[idx].target);
  const currentImpurity = calculateImpurity(currentTargets, isClassification, criterion, numClasses);

  let bestGain = -Infinity;
  let bestSplit: SplitResult | null = null;

  for (const featIdx of allowedFeatureIndices) {
    // Extract unique sorted values as candidate split points
    const values = indices.map((idx) => data[idx].features[featIdx]);
    const sortedUnique = Array.from(new Set(values)).sort((a, b) => a - b);

    if (sortedUnique.length <= 1) continue;

    // Test midpoints between consecutive unique values
    // To speed up search if many values, sample up to 15 percentiles
    const candidateThresholds: number[] = [];
    if (sortedUnique.length <= 20) {
      for (let i = 0; i < sortedUnique.length - 1; i++) {
        candidateThresholds.push((sortedUnique[i] + sortedUnique[i + 1]) / 2);
      }
    } else {
      const step = (sortedUnique.length - 1) / 15;
      for (let i = 0; i < 15; i++) {
        const idxA = Math.floor(i * step);
        const idxB = Math.min(sortedUnique.length - 1, idxA + 1);
        candidateThresholds.push((sortedUnique[idxA] + sortedUnique[idxB]) / 2);
      }
    }

    for (const threshold of candidateThresholds) {
      const left: number[] = [];
      const right: number[] = [];

      for (const idx of indices) {
        if (data[idx].features[featIdx] <= threshold) {
          left.push(idx);
        } else {
          right.push(idx);
        }
      }

      if (left.length < minSamplesLeaf || right.length < minSamplesLeaf) {
        continue;
      }

      const leftTargets = left.map((i) => data[i].target);
      const rightTargets = right.map((i) => data[i].target);

      const leftImpurity = calculateImpurity(leftTargets, isClassification, criterion, numClasses);
      const rightImpurity = calculateImpurity(rightTargets, isClassification, criterion, numClasses);

      const weightedImpurity = (left.length / n) * leftImpurity + (right.length / n) * rightImpurity;
      const gain = currentImpurity - weightedImpurity;

      if (gain > bestGain) {
        bestGain = gain;
        bestSplit = {
          featureIdx: featIdx,
          threshold: +threshold.toFixed(4),
          impurity: currentImpurity,
          gain,
          leftIndices: left,
          rightIndices: right,
        };
      }
    }
  }

  return bestSplit;
}

// Build the decision / regression tree recursively
export function buildTree(
  data: DataPoint[],
  indices: number[],
  depth: number,
  params: Hyperparameters,
  dataset: Dataset,
  featureSubsetRatio?: number, // for Random Forest feature bagging
  nodeIdCounter = { count: 0 },
  featureImportanceAcc?: number[]
): TreeNode {
  const isClassification = dataset.task === 'classification';
  const numClasses = dataset.targetLabels ? dataset.targetLabels.length : 1;
  const numFeatures = dataset.featureNames.length;
  const targets = indices.map((idx) => data[idx].target);
  const samples = indices.length;

  // Node prediction and value distribution
  let prediction: number;
  let predictionLabel: string | undefined;
  let value: number[];

  if (isClassification) {
    value = new Array(numClasses).fill(0);
    for (const t of targets) value[t]++;
    // Majority vote
    let maxCount = -1;
    let bestCls = 0;
    for (let c = 0; c < numClasses; c++) {
      if (value[c] > maxCount) {
        maxCount = value[c];
        bestCls = c;
      }
    }
    prediction = bestCls;
    predictionLabel = dataset.targetLabels ? dataset.targetLabels[bestCls] : `Clase ${bestCls}`;
  } else {
    const mean = targets.reduce((a, b) => a + b, 0) / (targets.length || 1);
    prediction = +mean.toFixed(2);
    predictionLabel = `${prediction} (media)`;
    value = [prediction];
  }

  const impurity = calculateImpurity(targets, isClassification, params.criterion, numClasses);

  const nodeId = `node_${++nodeIdCounter.count}`;

  // Stopping conditions:
  // 1. Max depth reached (if maxDepth > 0)
  // 2. Samples < minSamplesSplit
  // 3. Pure node (impurity == 0)
  // 4. Samples <= minSamplesLeaf
  const isPure = isClassification
    ? impurity <= 0.0001
    : targets.every((t) => Math.abs(t - targets[0]) < 0.001);

  const reachedMaxDepth = params.maxDepth > 0 && depth >= params.maxDepth;
  const cannotSplit = samples < params.minSamplesSplit || samples <= params.minSamplesLeaf * 2;

  if (isPure || reachedMaxDepth || cannotSplit) {
    return {
      id: nodeId,
      depth,
      isLeaf: true,
      impurity: +impurity.toFixed(4),
      samples,
      value,
      prediction,
      predictionLabel,
    };
  }

  // Feature subspace selection (for Random Forest)
  let allowedFeatures = Array.from({ length: numFeatures }, (_, i) => i);
  if (featureSubsetRatio && featureSubsetRatio < 1.0) {
    const k = Math.max(1, Math.round(numFeatures * featureSubsetRatio));
    // Shuffle and pick k features
    allowedFeatures = allowedFeatures.sort(() => Math.random() - 0.5).slice(0, k);
  }

  const split = findBestSplit(
    data,
    indices,
    allowedFeatures,
    isClassification,
    params.criterion,
    numClasses,
    params.minSamplesLeaf
  );

  if (!split || split.gain <= 0.00001) {
    return {
      id: nodeId,
      depth,
      isLeaf: true,
      impurity: +impurity.toFixed(4),
      samples,
      value,
      prediction,
      predictionLabel,
    };
  }

  // Accumulate feature importance: gain * (samples / totalSamples)
  if (featureImportanceAcc) {
    featureImportanceAcc[split.featureIdx] += split.gain * samples;
  }

  const leftChild = buildTree(
    data,
    split.leftIndices,
    depth + 1,
    params,
    dataset,
    featureSubsetRatio,
    nodeIdCounter,
    featureImportanceAcc
  );

  const rightChild = buildTree(
    data,
    split.rightIndices,
    depth + 1,
    params,
    dataset,
    featureSubsetRatio,
    nodeIdCounter,
    featureImportanceAcc
  );

  return {
    id: nodeId,
    depth,
    isLeaf: false,
    featureIdx: split.featureIdx,
    featureName: dataset.featureNames[split.featureIdx],
    threshold: split.threshold,
    impurity: +impurity.toFixed(4),
    samples,
    value,
    prediction,
    predictionLabel,
    left: leftChild,
    right: rightChild,
  };
}

// Predict for a single sample traversing the tree
export function predictSample(node: TreeNode, features: number[]): number {
  if (node.isLeaf || node.featureIdx === undefined || node.threshold === undefined) {
    return node.prediction;
  }
  if (features[node.featureIdx] <= node.threshold) {
    return node.left ? predictSample(node.left, features) : node.prediction;
  } else {
    return node.right ? predictSample(node.right, features) : node.prediction;
  }
}

// Predict probability distribution or class probabilities
export function predictProbabilities(node: TreeNode, features: number[]): number[] {
  if (node.isLeaf || node.featureIdx === undefined || node.threshold === undefined) {
    const total = node.value.reduce((a, b) => a + b, 0) || 1;
    return node.value.map((v) => v / total);
  }
  if (features[node.featureIdx] <= node.threshold) {
    return node.left ? predictProbabilities(node.left, features) : node.value;
  } else {
    return node.right ? predictProbabilities(node.right, features) : node.value;
  }
}

// Inspect path taken by sample for pedagogical visualizer
export interface TraversalStep {
  nodeId: string;
  featureName?: string;
  threshold?: number;
  value: number;
  decision: 'left' | 'right' | 'leaf';
  depth: number;
  prediction: number;
  predictionLabel?: string;
}

export function traceSamplePath(node: TreeNode, features: number[], path: TraversalStep[] = []): TraversalStep[] {
  if (node.isLeaf || node.featureIdx === undefined || node.threshold === undefined) {
    path.push({
      nodeId: node.id,
      depth: node.depth,
      value: features[0] ?? 0,
      decision: 'leaf',
      prediction: node.prediction,
      predictionLabel: node.predictionLabel,
    });
    return path;
  }

  const val = features[node.featureIdx];
  const goesLeft = val <= node.threshold;

  path.push({
    nodeId: node.id,
    featureName: node.featureName,
    threshold: node.threshold,
    value: val,
    decision: goesLeft ? 'left' : 'right',
    depth: node.depth,
    prediction: node.prediction,
    predictionLabel: node.predictionLabel,
  });

  if (goesLeft && node.left) {
    return traceSamplePath(node.left, features, path);
  } else if (!goesLeft && node.right) {
    return traceSamplePath(node.right, features, path);
  }

  return path;
}

// Compute tree structure statistics
export function getTreeStats(root: TreeNode): { maxDepth: number; nodeCount: number; leafCount: number } {
  let maxDepth = 0;
  let nodeCount = 0;
  let leafCount = 0;

  function traverse(node: TreeNode) {
    nodeCount++;
    if (node.depth > maxDepth) maxDepth = node.depth;
    if (node.isLeaf) {
      leafCount++;
    } else {
      if (node.left) traverse(node.left);
      if (node.right) traverse(node.right);
    }
  }

  traverse(root);
  return { maxDepth, nodeCount, leafCount };
}

// Compute comprehensive Model Metrics
export function evaluateModel(
  predictFn: (features: number[]) => number,
  trainData: DataPoint[],
  testData: DataPoint[],
  dataset: Dataset,
  treeStats: { maxDepth: number; nodeCount: number; leafCount: number },
  trainingTimeMs: number
): ModelMetrics {
  const isClassification = dataset.task === 'classification';

  // Evaluate Train
  let trainCorrect = 0;
  let trainSsq = 0;
  const yTrainTrue = trainData.map((d) => d.target);
  const yTrainPred = trainData.map((d) => predictFn(d.features));

  for (let i = 0; i < trainData.length; i++) {
    if (isClassification) {
      if (yTrainPred[i] === yTrainTrue[i]) trainCorrect++;
    } else {
      const err = yTrainTrue[i] - yTrainPred[i];
      trainSsq += err * err;
    }
  }

  // Evaluate Test
  let testCorrect = 0;
  let testSsq = 0;
  let testAbsErr = 0;
  const yTestTrue = testData.map((d) => d.target);
  const yTestPred = testData.map((d) => predictFn(d.features));

  for (let i = 0; i < testData.length; i++) {
    if (isClassification) {
      if (yTestPred[i] === yTestTrue[i]) testCorrect++;
    } else {
      const err = yTestTrue[i] - yTestPred[i];
      testSsq += err * err;
      testAbsErr += Math.abs(err);
    }
  }

  if (isClassification) {
    const trainAcc = trainCorrect / (trainData.length || 1);
    const testAcc = testCorrect / (testData.length || 1);

    // Multi-class macro precision/recall/f1
    const numClasses = dataset.targetLabels?.length || 2;
    let macroP = 0;
    let macroR = 0;
    let macroF1 = 0;

    for (let c = 0; c < numClasses; c++) {
      let tp = 0;
      let fp = 0;
      let fn = 0;
      for (let i = 0; i < testData.length; i++) {
        const pred = yTestPred[i];
        const actual = yTestTrue[i];
        if (pred === c && actual === c) tp++;
        if (pred === c && actual !== c) fp++;
        if (pred !== c && actual === c) fn++;
      }
      const p = tp + fp > 0 ? tp / (tp + fp) : 0;
      const r = tp + fn > 0 ? tp / (tp + fn) : 0;
      const f1 = p + r > 0 ? (2 * p * r) / (p + r) : 0;
      macroP += p;
      macroR += r;
      macroF1 += f1;
    }

    macroP /= numClasses;
    macroR /= numClasses;
    macroF1 /= numClasses;

    return {
      trainScore: +trainAcc.toFixed(4),
      testScore: +testAcc.toFixed(4),
      trainLoss: +(1 - trainAcc).toFixed(4),
      testLoss: +(1 - testAcc).toFixed(4),
      overfittingGap: +(trainAcc - testAcc).toFixed(4),
      treeDepth: treeStats.maxDepth,
      nodeCount: treeStats.nodeCount,
      leafCount: treeStats.leafCount,
      trainingTimeMs,
      accuracy: +testAcc.toFixed(4),
      precision: +macroP.toFixed(4),
      recall: +macroR.toFixed(4),
      f1: +macroF1.toFixed(4),
    };
  } else {
    // Regression Metrics: R2, MSE, RMSE, MAE
    const yTrainMean = yTrainTrue.reduce((a, b) => a + b, 0) / (yTrainTrue.length || 1);
    const trainTotSsq = yTrainTrue.reduce((sum, val) => sum + (val - yTrainMean) ** 2, 0);
    const trainR2 = trainTotSsq > 0 ? 1 - trainSsq / trainTotSsq : 0;

    const yTestMean = yTestTrue.reduce((a, b) => a + b, 0) / (yTestTrue.length || 1);
    const testTotSsq = yTestTrue.reduce((sum, val) => sum + (val - yTestMean) ** 2, 0);
    const testR2 = testTotSsq > 0 ? 1 - testSsq / testTotSsq : 0;

    const mse = testSsq / (testData.length || 1);
    const rmse = Math.sqrt(mse);
    const mae = testAbsErr / (testData.length || 1);

    return {
      trainScore: +Math.max(-1, trainR2).toFixed(4),
      testScore: +Math.max(-1, testR2).toFixed(4),
      trainLoss: +(trainSsq / (trainData.length || 1)).toFixed(2),
      testLoss: +mse.toFixed(2),
      overfittingGap: +(trainR2 - testR2).toFixed(4),
      treeDepth: treeStats.maxDepth,
      nodeCount: treeStats.nodeCount,
      leafCount: treeStats.leafCount,
      trainingTimeMs,
      r2: +Math.max(-1, testR2).toFixed(4),
      mse: +mse.toFixed(2),
      rmse: +rmse.toFixed(2),
      mae: +mae.toFixed(2),
    };
  }
}
