export type TaskType = 'classification' | 'regression';

export interface DataPoint {
  id: number;
  features: number[];
  target: number;
  targetLabel?: string;
}

export interface Dataset {
  id: string;
  name: string;
  task: TaskType;
  description: string;
  context: string;
  featureNames: string[];
  featureDescriptions: string[];
  targetName: string;
  targetLabels?: string[]; // for classification
  data: DataPoint[];
  trainRatio: number;
  xFeatureIdx: number; // For 2D plotting
  yFeatureIdx: number; // For 2D plotting
}

export type Criterion = 'gini' | 'entropy' | 'squared_error' | 'absolute_error';

export interface Hyperparameters {
  maxDepth: number; // 1 to 15, or -1 for unlimited
  minSamplesSplit: number; // 2 to 20
  minSamplesLeaf: number; // 1 to 20
  criterion: Criterion;
  // Random Forest specific
  nEstimators?: number; // 5 to 100
  maxFeaturesRatio?: number; // 0.3 to 1.0 (subsample features)
}

export interface TreeNode {
  id: string;
  depth: number;
  isLeaf: boolean;
  featureIdx?: number;
  featureName?: string;
  threshold?: number;
  impurity: number;
  samples: number;
  value: number[]; // class counts for classification or [mean] for regression
  prediction: number;
  predictionLabel?: string;
  left?: TreeNode;
  right?: TreeNode;
}

export interface ModelMetrics {
  trainScore: number; // accuracy (0-1) or R2 (-inf to 1)
  testScore: number;
  trainLoss: number; // Log-loss/MSE
  testLoss: number;
  overfittingGap: number; // trainScore - testScore
  treeDepth: number;
  nodeCount: number;
  leafCount: number;
  trainingTimeMs: number;
  // Specific metrics
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1?: number;
  r2?: number;
  mse?: number;
  mae?: number;
  rmse?: number;
}

export interface ModelComparisonResult {
  id: string;
  name: string;
  modelType: 'decision_tree' | 'random_forest';
  isTuned: boolean;
  params: Hyperparameters;
  metrics: ModelMetrics;
  featureImportances: { name: string; importance: number }[];
}

export interface CVFoldResult {
  foldIndex: number;
  trainIndices: number[];
  valIndices: number[];
  trainScore: number;
  valScore: number;
}

export interface CVResult {
  k: number;
  folds: CVFoldResult[];
  meanValScore: number;
  stdValScore: number;
  meanTrainScore: number;
}

export interface GridSearchParamRange {
  param: keyof Hyperparameters;
  label: string;
  values: (number | string)[];
}

export interface GridSearchCell {
  id: string;
  params: Partial<Hyperparameters>;
  meanScore: number;
  stdScore: number;
  trainMeanScore: number;
  foldScores: number[];
  isBest?: boolean;
}

export interface GridSearchResult {
  timestamp: number;
  totalCombinations: number;
  kFolds: number;
  evaluatedCells: GridSearchCell[];
  bestParams: Hyperparameters;
  bestScore: number;
}
