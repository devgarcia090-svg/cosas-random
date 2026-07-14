/*
 * calc.js — Motor de cálculos nutricionales y de composición corporal.
 * Todo en unidades métricas (kg, cm). Sin dependencias externas.
 */

// Edad en años a partir de la fecha de nacimiento (YYYY-MM-DD)
function ageFromBirthDate(birthDate, refDate) {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  const now = refDate ? new Date(refDate) : new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

// Multiplicadores de actividad física (para TDEE)
const ACTIVITY_FACTORS = {
  sedentary: 1.2,      // poco o nada de ejercicio
  light: 1.375,        // ejercicio ligero 1-3 días/semana
  moderate: 1.55,      // ejercicio moderado 3-5 días/semana
  active: 1.725,       // ejercicio intenso 6-7 días/semana
  very_active: 1.9,    // muy intenso / trabajo físico
};

const ACTIVITY_LABELS = {
  sedentary: 'Sedentario (poco o nada de ejercicio)',
  light: 'Ligero (1-3 días/semana)',
  moderate: 'Moderado (3-5 días/semana)',
  active: 'Activo (6-7 días/semana)',
  very_active: 'Muy activo (2x/día o trabajo físico)',
};

/*
 * Metabolismo basal (BMR) — fórmula de Mifflin-St Jeor.
 * Es la más precisa cuando no se conoce el % de grasa.
 * Si tenemos % de grasa, usamos Katch-McArdle (más precisa para gente entrenada).
 */
function calcBMR({ sex, weightKg, heightCm, age, bodyFatPct }) {
  if (!weightKg || !heightCm) return null;

  // Katch-McArdle si hay % de grasa fiable
  if (bodyFatPct && bodyFatPct > 0 && bodyFatPct < 60) {
    const leanMass = weightKg * (1 - bodyFatPct / 100);
    return Math.round(370 + 21.6 * leanMass);
  }

  if (age == null) return null;
  // Mifflin-St Jeor
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = sex === 'female' ? base - 161 : base + 5;
  return Math.round(bmr);
}

// Gasto energético total diario
function calcTDEE(bmr, activityLevel) {
  if (!bmr) return null;
  const factor = ACTIVITY_FACTORS[activityLevel] || 1.55;
  return Math.round(bmr * factor);
}

/*
 * Objetivos calóricos y de macros según la meta.
 * goal: 'lose_fat' | 'gain_muscle' | 'recomp'
 */
function calcTargets({ tdee, weightKg, goal, bodyFatPct }) {
  if (!tdee || !weightKg) return null;

  let calories, proteinPerKg, description;

  switch (goal) {
    case 'lose_fat':
      calories = Math.round(tdee * 0.8); // déficit ~20%
      proteinPerKg = 2.2;                // proteína alta para conservar músculo
      description = 'Déficit del 20% para perder grasa preservando músculo';
      break;
    case 'gain_muscle':
      calories = Math.round(tdee * 1.12); // superávit ~12% (lean bulk)
      proteinPerKg = 2.0;
      description = 'Superávit del 12% (lean bulk) para maximizar músculo y minimizar grasa';
      break;
    case 'recomp':
    default:
      calories = tdee; // mantenimiento
      proteinPerKg = 2.0;
      description = 'Mantenimiento calórico para recomposición corporal';
      break;
  }

  // La proteína se calcula sobre masa magra si conocemos el % de grasa,
  // si no, sobre el peso total.
  const refMass = (bodyFatPct && bodyFatPct > 0 && bodyFatPct < 60)
    ? weightKg * (1 - bodyFatPct / 100)
    : weightKg;

  const protein = Math.round(proteinPerKg * refMass);
  const proteinCals = protein * 4;

  // Grasa: 25% de las calorías totales
  const fat = Math.round((calories * 0.25) / 9);
  const fatCals = fat * 9;

  // El resto, carbohidratos
  const carbs = Math.max(0, Math.round((calories - proteinCals - fatCals) / 4));

  return {
    calories,
    protein,
    carbs,
    fat,
    proteinPerKg: Math.round(proteinPerKg * refMass / weightKg * 10) / 10,
    description,
  };
}

// IMC
function calcBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}

function bmiCategory(bmi) {
  if (bmi == null) return '';
  if (bmi < 18.5) return 'Bajo peso';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Sobrepeso';
  return 'Obesidad';
}

// Índice de masa magra (FFMI) — útil para seguir progreso de músculo
function calcFFMI(weightKg, heightCm, bodyFatPct) {
  if (!weightKg || !heightCm || bodyFatPct == null) return null;
  const leanMass = weightKg * (1 - bodyFatPct / 100);
  const h = heightCm / 100;
  const ffmi = leanMass / (h * h);
  // Ajuste normalizado a 1.80 m
  const adjusted = ffmi + 6.1 * (1.8 - h);
  return Math.round(adjusted * 10) / 10;
}

// Suma de macros de una lista de comidas
function sumMeals(meals) {
  return (meals || []).reduce((acc, m) => ({
    calories: acc.calories + (Number(m.calories) || 0),
    protein: acc.protein + (Number(m.protein) || 0),
    carbs: acc.carbs + (Number(m.carbs) || 0),
    fat: acc.fat + (Number(m.fat) || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

window.Calc = {
  ageFromBirthDate,
  ACTIVITY_FACTORS,
  ACTIVITY_LABELS,
  calcBMR,
  calcTDEE,
  calcTargets,
  calcBMI,
  bmiCategory,
  calcFFMI,
  sumMeals,
};
