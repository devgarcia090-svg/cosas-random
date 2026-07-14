/*
 * storage.js — Persistencia local (localStorage) + import/export CSV.
 * No hay servidor: todos tus datos viven en tu navegador.
 */

const STORAGE_KEY = 'nutritrack_v1';

const DEFAULT_STATE = {
  profile: {
    name: '',
    sex: 'male',
    birthDate: '',
    heightCm: null,
    activityLevel: 'moderate',
    goal: 'gain_muscle',
  },
  // Mediciones de la báscula
  measurements: [], // { id, date, weightKg, bodyFatPct, muscleMassKg, waterPct, boneMassKg, visceralFat, bmr }
  // Registros de nutrición por día
  nutrition: [],    // { date, meals: [{ id, name, calories, protein, carbs, fat }] }
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    // Merge defensivo con los defaults
    return {
      profile: { ...DEFAULT_STATE.profile, ...(parsed.profile || {}) },
      measurements: Array.isArray(parsed.measurements) ? parsed.measurements : [],
      nutrition: Array.isArray(parsed.nutrition) ? parsed.nutrition : [],
    };
  } catch (e) {
    console.error('Error cargando datos, se reinicia el estado', e);
    return structuredClone(DEFAULT_STATE);
  }
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// --- Mediciones ---

function addMeasurement(state, m) {
  const measurement = { id: genId(), ...m };
  // Si ya hay una medición ese día, la reemplazamos
  state.measurements = state.measurements.filter(x => x.date !== m.date);
  state.measurements.push(measurement);
  state.measurements.sort((a, b) => a.date.localeCompare(b.date));
  return measurement;
}

function deleteMeasurement(state, id) {
  state.measurements = state.measurements.filter(m => m.id !== id);
}

function latestMeasurement(state) {
  if (!state.measurements.length) return null;
  return state.measurements[state.measurements.length - 1];
}

// --- Nutrición ---

function getDayLog(state, date) {
  let day = state.nutrition.find(d => d.date === date);
  if (!day) {
    day = { date, meals: [] };
    state.nutrition.push(day);
    state.nutrition.sort((a, b) => a.date.localeCompare(b.date));
  }
  return day;
}

function addMeal(state, date, meal) {
  const day = getDayLog(state, date);
  day.meals.push({ id: genId(), ...meal });
}

function deleteMeal(state, date, mealId) {
  const day = state.nutrition.find(d => d.date === date);
  if (day) day.meals = day.meals.filter(m => m.id !== mealId);
}

// --- CSV import/export de mediciones ---

const CSV_FIELDS = ['date', 'weightKg', 'bodyFatPct', 'muscleMassKg', 'waterPct', 'boneMassKg', 'visceralFat', 'bmr'];
const CSV_HEADERS = ['fecha', 'peso_kg', 'grasa_pct', 'musculo_kg', 'agua_pct', 'hueso_kg', 'grasa_visceral', 'bmr'];

function exportMeasurementsCSV(state) {
  const rows = [CSV_HEADERS.join(',')];
  for (const m of state.measurements) {
    rows.push(CSV_FIELDS.map(f => (m[f] != null ? m[f] : '')).join(','));
  }
  return rows.join('\n');
}

function parseMeasurementsCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return [];
  const results = [];
  // Detectar si la primera línea es cabecera
  const first = lines[0].toLowerCase();
  const hasHeader = first.includes('fecha') || first.includes('date') || first.includes('peso') || first.includes('weight');
  const dataLines = hasHeader ? lines.slice(1) : lines;

  for (const line of dataLines) {
    const cols = line.split(/[,;\t]/).map(c => c.trim());
    if (cols.length < 2) continue;
    const m = {};
    CSV_FIELDS.forEach((f, i) => {
      const v = cols[i];
      if (v === undefined || v === '') return;
      m[f] = f === 'date' ? v : parseFloat(v.replace(',', '.'));
    });
    if (m.date && !isNaN(m.weightKg)) results.push(m);
  }
  return results;
}

function exportBackup(state) {
  return JSON.stringify(state, null, 2);
}

function importBackup(text) {
  const parsed = JSON.parse(text);
  return {
    profile: { ...DEFAULT_STATE.profile, ...(parsed.profile || {}) },
    measurements: Array.isArray(parsed.measurements) ? parsed.measurements : [],
    nutrition: Array.isArray(parsed.nutrition) ? parsed.nutrition : [],
  };
}

window.Storage = {
  DEFAULT_STATE,
  load,
  save,
  genId,
  addMeasurement,
  deleteMeasurement,
  latestMeasurement,
  getDayLog,
  addMeal,
  deleteMeal,
  exportMeasurementsCSV,
  parseMeasurementsCSV,
  exportBackup,
  importBackup,
};
