import React, { useState } from 'react';
import {
  BookOpen,
  X,
  GitFork,
  Layers,
  Cpu,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';

interface PedagogicalGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PedagogicalGuide: React.FC<PedagogicalGuideProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<
    'trees' | 'forest' | 'hyperparams' | 'cv' | 'gridsearch'
  >('trees');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                Guía Didáctica: Árboles, Random Forest y Optimización Scikit-Learn
              </h3>
              <p className="text-xs text-slate-400">
                Conceptos fundamentales explicados de forma pedagógica, visual y sin tecnicismos innecesarios
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-4 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveSection('trees')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'trees'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            1. Árbol de Decisión y Regresión
          </button>
          <button
            onClick={() => setActiveSection('hyperparams')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'hyperparams'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            2. Hiperparámetros y Sobreajuste
          </button>
          <button
            onClick={() => setActiveSection('forest')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'forest'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            3. Random Forest (Ensamble)
          </button>
          <button
            onClick={() => setActiveSection('cv')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'cv'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            4. Validación Cruzada (K-Fold)
          </button>
          <button
            onClick={() => setActiveSection('gridsearch')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'gridsearch'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            5. Búsqueda en Rejilla (GridSearchCV)
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-5 sm:p-6 text-slate-300 text-xs sm:text-sm space-y-5 leading-relaxed">
          {activeSection === 'trees' && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <GitFork className="w-5 h-5 text-emerald-400" />
                ¿Qué es un Árbol de Decisión y cómo divide el espacio?
              </h4>
              <p>
                Un <strong>Árbol de Decisión</strong> es un modelo de aprendizaje supervisado no paramétrico. Funciona como un diagrama de flujo de preguntas binarias consecutivas (ejemplo: <em>¿Es el alcohol ≤ 13.2%?</em>).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h5 className="font-bold text-emerald-400 text-xs uppercase">
                    Árbol de Decisión (Clasificación)
                  </h5>
                  <p className="text-xs text-slate-400">
                    En cada nodo, el algoritmo busca la variable y el umbral que divide las clases reduciendo al máximo la <strong>impureza</strong> (Gini o Entropía). Cada hoja predice la <strong>clase mayoritaria</strong> de las muestras que cayeron en ella.
                  </p>
                  <div className="bg-slate-900 p-2.5 rounded font-mono text-[11px] text-slate-300">
                    Gini = 1 - ∑ (p_i)²
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h5 className="font-bold text-amber-400 text-xs uppercase">
                    Árbol de Regresión
                  </h5>
                  <p className="text-xs text-slate-400">
                    Predice un valor continuo (ej. precio de una casa o emisiones de CO₂). En cada hoja, el árbol predice el <strong>promedio (media)</strong> de los valores de entrenamiento de esa región, produciendo una función continua en escalones.
                  </p>
                  <div className="bg-slate-900 p-2.5 rounded font-mono text-[11px] text-slate-300">
                    MSE = (1/n) ∑ (y_i - y_pred)²
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="font-semibold text-white block">
                  Propiedad geométrica esencial: Particiones Ortogonales
                </span>
                <p className="text-xs text-slate-400">
                  A diferencia de una regresión logística que traza líneas diagonales, un árbol solo puede trazar cortes paralelos a los ejes cartesianos (x ≤ c). Esto hace que divida el plano en rectángulos ortogonales.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'hyperparams' && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Los 4 Hiperparámetros Clave y el Peligro del Sobreajuste
              </h4>

              <div className="bg-rose-950/30 border border-rose-500/20 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-rose-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span>El gran peligro de los Árboles: Sobreajuste (Overfitting)</span>
                </div>
                <p className="text-rose-200/90">
                  Si dejas un árbol crecer libremente (sin poda), seguirá ramificándose hasta que cada hoja contenga exactamente 1 muestra aislada. En entrenamiento tendrá 100% de precisión, pero habrá memorizado el ruido estadístico. Al recibir datos nuevos de prueba, fallará estrepitosamente.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-emerald-400 text-xs">
                      1. max_depth (Profundidad Máxima)
                    </span>
                    <span className="text-[10px] text-slate-400">El freno más potente</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Limita la cantidad de preguntas consecutivas. Un árbol de profundidad 3 tendrá como máximo 8 hojas (2³), forzando a agrupar muestras y capturar solo tendencias generales.
                  </p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-emerald-400 text-xs">
                      2. min_samples_split (Muestras Mínimas para Dividir)
                    </span>
                    <span className="text-[10px] text-slate-400">Semáforo de bifurcación</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Un nodo solo intentará dividirse si contiene al menos este número de datos (por ejemplo, al menos 6 o 10 muestras). Evita crear ramas por casualidad estadística.
                  </p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-emerald-400 text-xs">
                      3. min_samples_leaf (Muestras Mínimas en Hoja)
                    </span>
                    <span className="text-[10px] text-slate-400">Suavizador de predicción</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Exige que ninguna hoja final quede con menos de este número de muestras. Garantiza que toda predicción esté respaldada por un colectivo de datos.
                  </p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-emerald-400 text-xs">
                      4. criterion (Función de Impureza)
                    </span>
                    <span className="text-[10px] text-slate-400">Métrica de división</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    En clasificación: <code>'gini'</code> (más rápido de calcular) vs <code>'entropy'</code> (mide la ganancia de información de Shannon). En regresión: <code>'squared_error'</code> (MSE estándar) vs <code>'absolute_error'</code> (robusto a outliers).
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'forest' && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                ¿Qué es Random Forest y por qué es superior?
              </h4>
              <p>
                <strong>Random Forest (Bosque Aleatorio)</strong> es un método de ensamble basado en <em>Bagging (Bootstrap Aggregation)</em> creado por Leo Breiman. En lugar de confiar en un solo árbol perfecto, entrena un ejército de 20, 50 o 100 árboles ligeramente imperfectos y combina sus decisiones.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-bold text-emerald-400 text-xs">
                    1. Muestreo Bootstrap
                  </span>
                  <p className="text-xs text-slate-400">
                    Cada árbol se entrena con un subconjunto aleatorio de los datos tomado <em>con reemplazo</em>. En promedio, cada árbol ve el 63.2% de los datos únicos; el 36.8% restante sirve como validación Out-Of-Bag (OOB).
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-bold text-emerald-400 text-xs">
                    2. Subespacio de Variables (max_features)
                  </span>
                  <p className="text-xs text-slate-400">
                    En cada split, el árbol solo tiene permitido elegir entre un subconjunto aleatorio de variables (típicamente √p). Esto <strong>descorrelaciona</strong> los árboles: evita que una variable dominante acapare siempre el primer corte.
                  </p>
                </div>
              </div>

              <div className="bg-emerald-950/30 border border-emerald-500/20 p-4 rounded-xl space-y-1.5 text-xs text-emerald-300">
                <span className="font-semibold block">
                  El milagro matemático: Reducción masiva de Varianza
                </span>
                <p className="text-emerald-200/90">
                  Al promediar N estimadores no correlacionados, la varianza del ensamble se reduce a <strong>Var / N</strong>. Por eso Random Forest casi nunca sobreajusta tan severamente como un árbol solitario y dibuja fronteras de decisión suaves y realistas.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'cv' && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-400" />
                Validación Cruzada (K-Fold Cross-Validation)
              </h4>
              <p>
                La validación cruzada es el estándar de oro en la ciencia de datos para medir el rendimiento de un modelo sin autoengañarnos.
              </p>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                <span className="font-semibold text-white block">
                  El procedimiento paso a paso (K=5):
                </span>
                <ol className="list-decimal list-inside space-y-2 text-slate-400">
                  <li>Se divide el dataset en 5 bloques (folds) de igual tamaño.</li>
                  <li>
                    <strong>Ronda 1:</strong> Se entrena con Folds 2, 3, 4 y 5. Se evalúa en el Fold 1.
                  </li>
                  <li>
                    <strong>Ronda 2:</strong> Se entrena con Folds 1, 3, 4 y 5. Se evalúa en el Fold 2.
                  </li>
                  <li>Se repite hasta que cada fold haya sido el conjunto de prueba exactamente 1 vez.</li>
                  <li>
                    El score final es el promedio de las 5 pruebas: <code>mean(scores) ± std(scores)</code>.
                  </li>
                </ol>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-400">
                <span className="font-semibold text-white block">
                  ¿Por qué es superior a un simple Train/Test split?
                </span>
                <p>
                  Si solo haces un corte fijo (80/20), la métrica depende de la fortuna del split aleatorio. La desviación estándar (± σ) de la validación cruzada te dice además cuán <em>estable</em> es el modelo: una desviación baja significa que el modelo responderá de forma confiable ante cualquier cliente o paciente nuevo.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'gridsearch' && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Búsqueda en Rejilla (GridSearchCV) con Scikit-Learn
              </h4>
              <p>
                Ajustar hiperparámetros "a ojo" o cambiando uno por uno es ineficiente y sesgado. <strong>GridSearchCV</strong> automatiza este proceso de forma matemática exhaustiva.
              </p>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="font-semibold text-white block">
                  ¿Cómo funciona la rejilla?
                </span>
                <p className="text-slate-400">
                  Defines una lista de candidatos para cada hiperparámetro. GridSearchCV calcula el producto cartesiano de todas las combinaciones posibles y entrena un modelo con Validación Cruzada para cada celda de la rejilla.
                </p>
                <div className="bg-slate-900 p-2.5 rounded font-mono text-[11px] text-emerald-300">
                  4 profundidades × 3 splits × 3 hojas = 36 combinaciones × 5 folds = 180 entrenamientos
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="font-semibold text-white block">
                  Atributos clave que devuelve Scikit-Learn:
                </span>
                <ul className="space-y-1 text-slate-400 font-mono text-[11px]">
                  <li>
                    <strong className="text-emerald-400">grid.best_params_:</strong> Diccionario con los mejores valores (ej. {'{max_depth: 3, min_samples_leaf: 2}'}).
                  </li>
                  <li>
                    <strong className="text-emerald-400">grid.best_score_:</strong> La precisión media más alta obtenida durante la validación cruzada.
                  </li>
                  <li>
                    <strong className="text-emerald-400">grid.best_estimator_:</strong> El modelo final ya reentrenado automáticamente con todo el conjunto de entrenamiento.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Diseñado para aprendizaje didáctico interactivo</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
          >
            Entendido, volver al Laboratorio
          </button>
        </div>
      </div>
    </div>
  );
};
