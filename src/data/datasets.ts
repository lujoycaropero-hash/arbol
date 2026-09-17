import { Dataset, DataPoint } from '../types';

// Seeded pseudo-random generator for reproducible datasets
function createRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// 1. CLASIFICACIÓN: Cultivares de Vino (Wine Dataset - Scikit-Learn classic)
function generateWineDataset(): Dataset {
  const rng = createRng(42);
  const data: DataPoint[] = [];

  // 3 classes of wine cultivars: 0 = Barolo, 1 = Grignolino, 2 = Barbera
  // Features: [Alcohol (%), Flavonoides, Intensidad de Color, Prolina (mg/L)]
  const classConfigs = [
    { label: 'Barolo', count: 45, center: [13.7, 3.0, 5.5, 1100], spreads: [0.45, 0.35, 0.8, 120] },
    { label: 'Grignolino', count: 55, center: [12.3, 2.1, 3.0, 500], spreads: [0.5, 0.3, 0.6, 90] },
    { label: 'Barbera', count: 40, center: [13.1, 0.8, 7.3, 620], spreads: [0.5, 0.25, 1.1, 100] },
  ];

  let id = 1;
  classConfigs.forEach((cfg, clsIdx) => {
    for (let i = 0; i < cfg.count; i++) {
      const alcohol = +(cfg.center[0] + (rng() - 0.5) * 2 * cfg.spreads[0]).toFixed(2);
      const flavonoids = +(cfg.center[1] + (rng() - 0.5) * 2 * cfg.spreads[1]).toFixed(2);
      const colorIntensity = +(cfg.center[2] + (rng() - 0.5) * 2 * cfg.spreads[2]).toFixed(2);
      const proline = Math.round(cfg.center[3] + (rng() - 0.5) * 2 * cfg.spreads[3]);

      data.push({
        id: id++,
        features: [alcohol, flavonoids, colorIntensity, proline],
        target: clsIdx,
        targetLabel: cfg.label,
      });
    }
  });

  return {
    id: 'wine',
    name: 'Vinos de Italia (Wine Dataset)',
    task: 'classification',
    description: 'Clasificación química de 3 variedades de vino italiano cultivadas en la misma región pero con perfiles distintivos.',
    context: 'Un problema clásico de Scikit-Learn ideal para ver cómo un Árbol de Decisión encuentra umbrales de alcohol y flavonoides para separar variedades.',
    featureNames: ['Alcohol (%)', 'Flavonoides', 'Intensidad Color', 'Prolina (mg/L)'],
    featureDescriptions: [
      'Graduación alcohólica del vino en porcentaje volumétrico.',
      'Concentración de flavonoides (antioxidantes fenólicos que influyen en sabor y cuerpo).',
      'Intensidad del color medida por espectrofotometría.',
      'Aminoácido prolina, clave para identificar el vigor de la cepa.'
    ],
    targetName: 'Variedad de Vino',
    targetLabels: ['Barolo', 'Grignolino', 'Barbera'],
    data,
    trainRatio: 0.75,
    xFeatureIdx: 0, // Alcohol
    yFeatureIdx: 1, // Flavonoides
  };
}

// 2. CLASIFICACIÓN: Iris de Fisher (El dataset pedagógico por excelencia)
function generateIrisDataset(): Dataset {
  const rng = createRng(101);
  const data: DataPoint[] = [];

  const classConfigs = [
    { label: 'Setosa', count: 40, center: [5.0, 3.4, 1.5, 0.25], spreads: [0.35, 0.35, 0.2, 0.1] },
    { label: 'Versicolor', count: 40, center: [5.9, 2.75, 4.25, 1.3], spreads: [0.45, 0.3, 0.4, 0.2] },
    { label: 'Virginica', count: 40, center: [6.6, 3.0, 5.55, 2.05], spreads: [0.55, 0.3, 0.5, 0.25] },
  ];

  let id = 1;
  classConfigs.forEach((cfg, clsIdx) => {
    for (let i = 0; i < cfg.count; i++) {
      const sl = +(cfg.center[0] + (rng() - 0.5) * 2 * cfg.spreads[0]).toFixed(1);
      const sw = +(cfg.center[1] + (rng() - 0.5) * 2 * cfg.spreads[1]).toFixed(1);
      const pl = +(cfg.center[2] + (rng() - 0.5) * 2 * cfg.spreads[2]).toFixed(1);
      const pw = +(cfg.center[3] + (rng() - 0.5) * 2 * cfg.spreads[3]).toFixed(1);

      data.push({
        id: id++,
        features: [sl, sw, pl, pw],
        target: clsIdx,
        targetLabel: cfg.label,
      });
    }
  });

  return {
    id: 'iris',
    name: 'Flores Iris (Fisher Dataset)',
    task: 'classification',
    description: 'El dataset más famoso en la historia del Machine Learning para enseñar árboles de decisión y particiones ortogonales.',
    context: 'Permite comprender de un vistazo cómo la longitud y ancho del pétalo separan de manera casi perfecta las tres especies de orquídeas.',
    featureNames: ['Longitud Sépalo (cm)', 'Ancho Sépalo (cm)', 'Longitud Pétalo (cm)', 'Ancho Pétalo (cm)'],
    featureDescriptions: [
      'Largo del sépalo de la flor.',
      'Ancho del sépalo de la flor.',
      'Largo del pétalo (característica sumamente discriminatoria).',
      'Ancho del pétalo (divide nítidamente versicolor de virginica).'
    ],
    targetName: 'Especie',
    targetLabels: ['Setosa', 'Versicolor', 'Virginica'],
    data,
    trainRatio: 0.75,
    xFeatureIdx: 2, // Longitud Pétalo
    yFeatureIdx: 3, // Ancho Pétalo
  };
}

// 3. CLASIFICACIÓN: Salud Cardiovascular / Riesgo Cardíaco
function generateHeartDataset(): Dataset {
  const rng = createRng(303);
  const data: DataPoint[] = [];

  for (let i = 0; i < 130; i++) {
    const age = Math.round(35 + rng() * 38);
    const bp = Math.round(105 + rng() * 65);
    const chol = Math.round(155 + rng() * 140);
    const maxHeartRate = Math.round(100 + rng() * 95);

    // Realistic clinical risk score
    const riskScore = (age - 45) * 0.04 + (bp - 125) * 0.03 + (chol - 210) * 0.02 - (maxHeartRate - 145) * 0.03 + (rng() - 0.5) * 0.8;
    const isHighRisk = riskScore > 0 ? 1 : 0;

    data.push({
      id: i + 1,
      features: [age, bp, chol, maxHeartRate],
      target: isHighRisk,
      targetLabel: isHighRisk === 1 ? 'Alto Riesgo' : 'Bajo Riesgo',
    });
  }

  return {
    id: 'heart',
    name: 'Riesgo Cardiovascular (Heart Health)',
    task: 'classification',
    description: 'Predicción de riesgo cardíaco a partir de biomarcadores clínicos (edad, presión arterial, colesterol y frecuencia cardíaca).',
    context: 'Un escenario real de medicina donde las reglas de decisión de un Árbol son interpretables y auditables por médicos.',
    featureNames: ['Edad (años)', 'Presión Arterial (mmHg)', 'Colesterol (mg/dL)', 'Frecuencia Máx (lpm)'],
    featureDescriptions: [
      'Edad del paciente en años.',
      'Presión arterial sistólica en reposo al ingresar a consulta.',
      'Nivel de colesterol sérico total.',
      'Frecuencia cardíaca máxima alcanzada en prueba de esfuerzo.'
    ],
    targetName: 'Nivel de Riesgo',
    targetLabels: ['Bajo Riesgo', 'Alto Riesgo'],
    data,
    trainRatio: 0.75,
    xFeatureIdx: 0, // Edad
    yFeatureIdx: 1, // Presión
  };
}

// 4. REGRESIÓN: Precios de Viviendas (California / Boston Housing)
function generateHousingDataset(): Dataset {
  const rng = createRng(777);
  const data: DataPoint[] = [];

  for (let i = 0; i < 140; i++) {
    const rooms = +(3.5 + rng() * 4.5).toFixed(1); // 3.5 to 8.0 rooms
    const income = +(1.5 + rng() * 9.0).toFixed(2); // Mediana de ingresos en decenas de miles ($15k - $105k)
    const age = Math.round(3 + rng() * 45); // Antigüedad años
    const crimeRate = +(0.1 + rng() * 8.5).toFixed(2); // Indice de criminalidad local

    // Price formula with non-linear tree-friendly relationships + noise
    let price = 60 + (income * 28) + (rooms * 24) - (crimeRate * 5) - (age * 0.4);
    // Non-linear boost for luxury high income + large rooms
    if (income > 6.0 && rooms > 6.0) price += 45;
    price += (rng() - 0.5) * 35;
    price = Math.max(50, Math.round(price));

    data.push({
      id: i + 1,
      features: [rooms, income, age, crimeRate],
      target: price,
    });
  }

  return {
    id: 'housing',
    name: 'Precios de Viviendas (Housing Prices)',
    task: 'regression',
    description: 'Predicción del valor de mercado de casas ($k USD) en función de habitaciones, ingresos de la zona y características del vecindario.',
    context: 'Permite visualizar claramente cómo un Árbol de Regresión divide el espacio en cajas ortogonales y predice el promedio de cada grupo.',
    featureNames: ['Habitaciones Promedio', 'Ingreso Mediano ($10k)', 'Antigüedad (Años)', 'Tasa Criminalidad'],
    featureDescriptions: [
      'Número promedio de habitaciones por vivienda.',
      'Ingreso mediano familiar en la zona en decenas de miles de dólares.',
      'Edad promedio de las edificaciones.',
      'Índice de criminalidad por habitante en el distrito.'
    ],
    targetName: 'Precio de Vivienda ($k USD)',
    data,
    trainRatio: 0.75,
    xFeatureIdx: 1, // Ingreso Mediano
    yFeatureIdx: 0, // Habitaciones
  };
}

// 5. REGRESIÓN: Emisiones de CO2 en Vehículos
function generateEmissionsDataset(): Dataset {
  const rng = createRng(888);
  const data: DataPoint[] = [];

  for (let i = 0; i < 130; i++) {
    const engineSize = +(1.0 + rng() * 4.2).toFixed(1); // 1.0L to 5.2L
    const cylinders = Math.round(3 + (engineSize / 1.2) + (rng() - 0.5) * 1.5);
    const clampedCylinders = Math.max(3, Math.min(8, cylinders));
    const fuelConsumption = +(4.8 + engineSize * 2.2 + (rng() - 0.5) * 2.0).toFixed(1); // L/100km
    const vehicleWeight = Math.round(950 + engineSize * 300 + (rng() - 0.5) * 250); // kg

    let emissions = 75 + (engineSize * 28) + (fuelConsumption * 9.5) + (vehicleWeight * 0.035) + (rng() - 0.5) * 20;
    emissions = Math.round(emissions);

    data.push({
      id: i + 1,
      features: [engineSize, fuelConsumption, vehicleWeight, clampedCylinders],
      target: emissions,
    });
  }

  return {
    id: 'emissions',
    name: 'Emisiones de CO₂ en Automóviles',
    task: 'regression',
    description: 'Predicción de emisiones de dióxido de carbono (g/km) según cilindrada del motor, consumo de combustible y peso.',
    context: 'Ilustra cómo Random Forest suaviza las predicciones de escalón de un árbol simple, aproximando la curva física del motor.',
    featureNames: ['Tamaño Motor (Litros)', 'Consumo (L/100km)', 'Peso Vehículo (kg)', 'Cilindros'],
    featureDescriptions: [
      'Cilindrada del motor en litros.',
      'Consumo combinado de combustible por cada 100 kilómetros.',
      'Peso total del vehículo en kilogramos.',
      'Número de cilindros del motor.'
    ],
    targetName: 'Emisiones CO₂ (g/km)',
    data,
    trainRatio: 0.75,
    xFeatureIdx: 0, // Tamaño Motor
    yFeatureIdx: 1, // Consumo
  };
}

export const ALL_DATASETS: Dataset[] = [
  generateWineDataset(),
  generateIrisDataset(),
  generateHeartDataset(),
  generateHousingDataset(),
  generateEmissionsDataset(),
];
