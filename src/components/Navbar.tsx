import React from 'react';
import { ALL_DATASETS } from '../data/datasets';
import { Dataset } from '../types';
import {
  GitFork,
  Code2,
  BookOpen,
  Sliders,
  BarChart2,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  currentDataset: Dataset;
  onSelectDataset: (dataset: Dataset) => void;
  activeTab: 'visualizer' | 'gridsearch' | 'comparison' | 'predictor' | 'cv_breakdown';
  onSelectTab: (tab: 'visualizer' | 'gridsearch' | 'comparison' | 'predictor' | 'cv_breakdown') => void;
  onOpenCodeModal: () => void;
  onOpenGuideModal: () => void;
  modelType: 'decision_tree' | 'random_forest';
  onChangeModelType: (type: 'decision_tree' | 'random_forest') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDataset,
  onSelectDataset,
  activeTab,
  onSelectTab,
  onOpenCodeModal,
  onOpenGuideModal,
  modelType,
  onChangeModelType,
}) => {
  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-sm">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                ML Tree Lab
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Scikit-Learn Didáctico
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Árboles de Decisión, Regresión, Random Forest, Validación Cruzada y GridSearchCV
            </p>
          </div>
        </div>

        {/* Dataset Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <label htmlFor="dataset-select" className="text-xs font-medium text-slate-300">
            Dataset:
          </label>
          <select
            id="dataset-select"
            value={currentDataset.id}
            onChange={(e) => {
              const ds = ALL_DATASETS.find((d) => d.id === e.target.value);
              if (ds) onSelectDataset(ds);
            }}
            className="bg-slate-800 text-slate-100 text-xs sm:text-sm font-medium rounded-lg px-3 py-1.5 border border-slate-700 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
          >
            <optgroup label="Clasificación">
              {ALL_DATASETS.filter((d) => d.task === 'classification').map((ds) => (
                <option key={ds.id} value={ds.id}>
                  🏷️ {ds.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Regresión">
              {ALL_DATASETS.filter((d) => d.task === 'regression').map((ds) => (
                <option key={ds.id} value={ds.id}>
                  📈 {ds.name}
                </option>
              ))}
            </optgroup>
          </select>

          {/* Task Tag */}
          <span
            className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
              currentDataset.task === 'classification'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            {currentDataset.task === 'classification' ? 'Clasificación' : 'Regresión'}
          </span>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1.5 ml-1">
            <button
              id="btn-open-code-modal"
              onClick={onOpenCodeModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors"
              title="Ver código Python Scikit-Learn listo para Google Colab"
            >
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">Código Scikit-Learn</span>
            </button>
            <button
              id="btn-open-guide-modal"
              onClick={onOpenGuideModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
              title="Guía didáctica y conceptos paso a paso"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden md:inline">Guía Pedagógica</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Bar */}
      <div className="bg-slate-950/80 border-t border-slate-800/80 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto py-1.5 gap-4 scrollbar-none">
          {/* Model Switcher */}
          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 shrink-0">
            <button
              id="btn-model-tree"
              onClick={() => onChangeModelType('decision_tree')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                modelType === 'decision_tree'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              {currentDataset.task === 'classification' ? 'Árbol de Decisión' : 'Árbol de Regresión'}
            </button>
            <button
              id="btn-model-forest"
              onClick={() => onChangeModelType('random_forest')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                modelType === 'random_forest'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Random Forest (Ensemble)
            </button>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 shrink-0">
            <button
              id="tab-visualizer"
              onClick={() => onSelectTab('visualizer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'visualizer'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Tuning & Visualizador
            </button>

            <button
              id="tab-cv-breakdown"
              onClick={() => onSelectTab('cv_breakdown')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'cv_breakdown'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Validación Cruzada (K-Fold)
            </button>

            <button
              id="tab-gridsearch"
              onClick={() => onSelectTab('gridsearch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'gridsearch'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              GridSearchCV (Búsqueda en Rejilla)
            </button>

            <button
              id="tab-comparison"
              onClick={() => onSelectTab('comparison')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'comparison'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Comparativa de Rendimiento
            </button>

            <button
              id="tab-predictor"
              onClick={() => onSelectTab('predictor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'predictor'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Probador en Vivo (What-If)
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
