import React, { useState } from 'react';
import { Dataset, Hyperparameters } from '../types';
import { X, Copy, Check, Code2, ExternalLink } from 'lucide-react';

interface ScikitLearnCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: Dataset;
  params: Hyperparameters;
  modelType: 'decision_tree' | 'random_forest';
}

export const ScikitLearnCodeModal: React.FC<ScikitLearnCodeModalProps> = ({
  isOpen,
  onClose,
  dataset,
  params,
  modelType,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const isClassification = dataset.task === 'classification';

  // Generate python code
  const pythonCode = `# ==============================================================================
# Laboratorio Scikit-Learn: Árboles de Decisión, Regresión y Random Forest
# Dataset: ${dataset.name} (${isClassification ? 'Clasificación' : 'Regresión'})
# ==============================================================================

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split, KFold, cross_val_score, GridSearchCV
${
  isClassification
    ? `from sklearn.tree import DecisionTreeClassifier, plot_tree
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix`
    : `from sklearn.tree import DecisionTreeRegressor, plot_tree
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error`
}

# 1. PREPARACIÓN DEL CONJUNTO DE DATOS
# Características: ${dataset.featureNames.join(', ')}
# Variable Objetivo: ${dataset.targetName}

${
  dataset.id === 'wine'
    ? `from sklearn.datasets import load_wine
data = load_wine()
X = data.data[:, [0, 6, 9, 12]]  # Alcohol, Flavonoids, Color, Proline
y = data.target
feature_names = ['Alcohol', 'Flavonoides', 'Intensidad Color', 'Prolina']`
    : dataset.id === 'iris'
    ? `from sklearn.datasets import load_iris
data = load_iris()
X = data.data
y = data.target
feature_names = data.feature_names`
    : `# Datos de ejemplo estructurados
X = np.array([
${dataset.data.slice(0, 8).map((d) => `    [${d.features.join(', ')}],`).join('\n')}
    # ... resto del dataset ...
])
y = np.array([${dataset.data.slice(0, 8).map((d) => d.target).join(', ')}])
feature_names = ${JSON.stringify(dataset.featureNames)}`
}

# División Train / Test (75% Entrenamiento, 25% Prueba independiente)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42${isClassification ? ', stratify=y' : ''}
)

print(f"Muestras de Entrenamiento: {X_train.shape[0]}")
print(f"Muestras de Prueba: {X_test.shape[0]}")

# 2. DEFINICIÓN DEL MODELO BASE CON HIPERPARÁMETROS ACTIVOS
${
  modelType === 'decision_tree'
    ? isClassification
      ? `model = DecisionTreeClassifier(
    criterion='${params.criterion}',
    max_depth=${params.maxDepth === -1 ? 'None' : params.maxDepth},
    min_samples_split=${params.minSamplesSplit},
    min_samples_leaf=${params.minSamplesLeaf},
    random_state=42
)`
      : `model = DecisionTreeRegressor(
    criterion='${params.criterion}',
    max_depth=${params.maxDepth === -1 ? 'None' : params.maxDepth},
    min_samples_split=${params.minSamplesSplit},
    min_samples_leaf=${params.minSamplesLeaf},
    random_state=42
)`
    : isClassification
    ? `model = RandomForestClassifier(
    n_estimators=${params.nEstimators || 25},
    criterion='${params.criterion}',
    max_depth=${params.maxDepth === -1 ? 'None' : params.maxDepth},
    min_samples_split=${params.minSamplesSplit},
    min_samples_leaf=${params.minSamplesLeaf},
    random_state=42
)`
    : `model = RandomForestRegressor(
    n_estimators=${params.nEstimators || 25},
    criterion='${params.criterion}',
    max_depth=${params.maxDepth === -1 ? 'None' : params.maxDepth},
    min_samples_split=${params.minSamplesSplit},
    min_samples_leaf=${params.minSamplesLeaf},
    random_state=42
)`
}

# 3. VALIDACIÓN CRUZADA K-FOLD (k=5)
# Permite estimar la precisión media sin sesgo de una sola partición
kfold = KFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(model, X_train, y_train, cv=kfold, scoring='${
  isClassification ? 'accuracy' : 'r2'
}')

print(f"Scores por fold: {np.round(cv_scores, 4)}")
print(f"Score medio CV: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

# 4. OPTIMIZACIÓN CON BÚSQUEDA EN REJILLA (GridSearchCV)
param_grid = {
    'max_depth': [2, 3, 4, 6, 8],
    'min_samples_split': [2, 5, 10],
    'min_samples_leaf': [1, 2, 4],${
  modelType === 'random_forest'
    ? `\n    'n_estimators': [15, 30, 50],`
    : ''
}
}

grid_search = GridSearchCV(
    estimator=model,
    param_grid=param_grid,
    cv=5,
    scoring='${isClassification ? 'accuracy' : 'r2'}',
    n_jobs=-1,
    return_train_score=True
)

grid_search.fit(X_train, y_train)

print("\\n--- RESULTADOS GRID SEARCH ---")
print("Mejores hiperparámetros:", grid_search.best_params_)
print(f"Mejor score de CV: {grid_search.best_score_:.4f}")

# 5. EVALUACIÓN FINAL EN CONJUNTO DE PRUEBA (TEST SET)
best_model = grid_search.best_estimator_
y_pred = best_model.predict(X_test)

${
  isClassification
    ? `print("\\n--- EVALUACIÓN EN TEST SET ---")
print(f"Accuracy Test: {accuracy_score(y_test, y_pred):.4f}")
print("\\nReporte de Clasificación:")
print(classification_report(y_test, y_pred))`
    : `print("\\n--- EVALUACIÓN EN TEST SET ---")
print(f"R2 Score: {r2_score(y_test, y_pred):.4f}")
print(f"MSE: {mean_squared_error(y_test, y_pred):.4f}")
print(f"MAE: {mean_absolute_error(y_test, y_pred):.4f}")`
}

# 6. IMPORTANCIA DE CARACTERÍSTICAS (MDI)
importances = best_model.feature_importances_
for name, imp in sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True):
    print(f"Característica {name}: {imp*100:.2f}%")

${
  modelType === 'decision_tree'
    ? `# 7. GRAFICAR EL ÁRBOL
plt.figure(figsize=(16, 8))
plot_tree(best_model, feature_names=feature_names, filled=True, rounded=True)
plt.title("Árbol de Decisión Optimizado con GridSearchCV")
plt.show()`
    : `# 7. GRAFICAR IMPORTANCIA DE VARIABLES
plt.figure(figsize=(8, 4))
plt.barh(feature_names, importances, color='teal')
plt.xlabel("Importancia Relativa")
plt.title("Importancia de Variables en Random Forest")
plt.show()`
}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                Código Scikit-Learn (Python)
              </h3>
              <p className="text-xs text-slate-400">
                Listo para copiar y ejecutar en Google Colab o Jupyter Notebook
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Código</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Code View Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-5 bg-slate-950">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre selection:bg-emerald-900 selection:text-white">
            {pythonCode}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span>Compatible con Python 3.9+ y Scikit-Learn 1.2+</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
