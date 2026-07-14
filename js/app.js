/*
 * app.js — Lógica principal de la interfaz.
 * Une perfil, cálculos, báscula, nutrición y gráficas.
 */
(function () {
  'use strict';

  const state = window.Storage.load();
  let selectedFood = null; // alimento elegido en el buscador

  // --- Utilidades ---
  const $ = id => document.getElementById(id);
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const num = v => { const n = parseFloat(v); return isNaN(n) ? null : n; };

  const GOAL_LABELS = {
    gain_muscle: 'Ganar músculo',
    lose_fat: 'Perder grasa',
    recomp: 'Recomposición',
  };

  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 2200);
  }

  function persist() { window.Storage.save(state); }

  // --- Perfil y objetivos ---

  function getComputedTargets() {
    const p = state.profile;
    const latest = window.Storage.latestMeasurement(state);
    const weightKg = latest ? latest.weightKg : null;
    const bodyFatPct = latest ? latest.bodyFatPct : null;
    if (!weightKg || !p.heightCm) return null;

    const age = window.Calc.ageFromBirthDate(p.birthDate);
    const bmr = window.Calc.calcBMR({
      sex: p.sex, weightKg, heightCm: p.heightCm, age, bodyFatPct,
    });
    const tdee = window.Calc.calcTDEE(bmr, p.activityLevel);
    const targets = window.Calc.calcTargets({ tdee, weightKg, goal: p.goal, bodyFatPct });
    return { bmr, tdee, targets, weightKg, bodyFatPct, age };
  }

  function renderProfileForm() {
    const p = state.profile;
    $('pName').value = p.name || '';
    $('pSex').value = p.sex || 'male';
    $('pBirth').value = p.birthDate || '';
    $('pHeight').value = p.heightCm || '';
    $('pGoal').value = p.goal || 'gain_muscle';

    const act = $('pActivity');
    if (!act.options.length) {
      Object.entries(window.Calc.ACTIVITY_LABELS).forEach(([k, label]) => {
        const o = document.createElement('option');
        o.value = k; o.textContent = label;
        act.appendChild(o);
      });
    }
    act.value = p.activityLevel || 'moderate';

    $('goalBadge').textContent = GOAL_LABELS[p.goal] || 'Objetivo';
  }

  function renderTargetsExplain() {
    const c = getComputedTargets();
    const el = $('targetsExplain');
    if (!c) {
      el.innerHTML = '<p class="muted">Completa tu altura, fecha de nacimiento y registra al menos una medición de peso en la pestaña <strong>Báscula</strong> para calcular tus objetivos.</p>';
      return;
    }
    const t = c.targets;
    el.innerHTML = `
      <div class="metric-grid">
        <div class="metric"><div class="value">${c.bmr}<span class="unit"> kcal</span></div><div class="label">Metabolismo basal (BMR)</div></div>
        <div class="metric"><div class="value">${c.tdee}<span class="unit"> kcal</span></div><div class="label">Gasto total diario (TDEE)</div></div>
        <div class="metric"><div class="value">${t.calories}<span class="unit"> kcal</span></div><div class="label">Objetivo diario</div></div>
        <div class="metric"><div class="value">${t.protein}<span class="unit"> g</span></div><div class="label">Proteína (${t.proteinPerKg} g/kg)</div></div>
        <div class="metric"><div class="value">${t.carbs}<span class="unit"> g</span></div><div class="label">Carbohidratos</div></div>
        <div class="metric"><div class="value">${t.fat}<span class="unit"> g</span></div><div class="label">Grasa</div></div>
      </div>
      <div class="callout mt">${t.description}.</div>`;
  }

  // --- Pestaña HOY ---

  function renderToday() {
    const date = todayISO();
    $('todayDateLabel').textContent = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    const hasProfile = state.profile.heightCm && state.measurements.length;
    $('welcomeCallout').style.display = hasProfile ? 'none' : 'block';

    const c = getComputedTargets();
    const day = state.nutrition.find(d => d.date === date);
    const eaten = window.Calc.sumMeals(day ? day.meals : []);

    // Anillos de macros
    const ringsEl = $('macroRings');
    if (c) {
      const t = c.targets;
      ringsEl.innerHTML =
        window.Charts.progressRing(eaten.calories, t.calories, 'var(--accent)', 'Calorías', 'kcal') +
        window.Charts.progressRing(eaten.protein, t.protein, 'var(--protein)', 'Proteína', 'g') +
        window.Charts.progressRing(eaten.carbs, t.carbs, 'var(--carbs)', 'Carbos', 'g') +
        window.Charts.progressRing(eaten.fat, t.fat, 'var(--fat)', 'Grasa', 'g');

      const remaining = t.calories - eaten.calories;
      const pct = Math.min(100, Math.round(eaten.calories / t.calories * 100));
      const color = eaten.calories > t.calories ? 'var(--danger)' : 'var(--accent-2)';
      $('calorieBar').innerHTML = `
        <div class="muted">${remaining >= 0 ? `Te quedan <strong style="color:var(--text)">${remaining} kcal</strong> para tu objetivo` : `Te has pasado <strong style="color:var(--danger)">${-remaining} kcal</strong>`}</div>
        <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${pct}%;background:${color}"></div></div>`;
    } else {
      ringsEl.innerHTML = '<p class="empty">Configura tu perfil y registra tu peso para ver tus objetivos diarios.</p>';
      $('calorieBar').innerHTML = '';
    }

    // Lista de comidas de hoy
    const ul = $('todayMeals');
    if (!day || !day.meals.length) {
      ul.innerHTML = '<p class="empty">Aún no has registrado comidas hoy.</p>';
      return;
    }
    ul.innerHTML = '';
    for (const m of day.meals) {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="item-main">
          <div class="item-name">${escapeHtml(m.name)}</div>
          <div class="macro-chips">
            <span class="chip">${m.calories} kcal</span>
            <span class="chip p">P ${m.protein}g</span>
            <span class="chip c">C ${m.carbs}g</span>
            <span class="chip f">G ${m.fat}g</span>
          </div>
        </div>
        <button class="btn danger" data-del-meal="${m.id}">Borrar</button>`;
      ul.appendChild(li);
    }
    ul.querySelectorAll('[data-del-meal]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.Storage.deleteMeal(state, date, btn.dataset.delMeal);
        persist(); renderToday();
      });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // --- Buscador de alimentos ---

  function setupFoodSearch() {
    const input = $('foodSearch');
    const results = $('foodResults');

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (!q) { results.style.display = 'none'; return; }
      const matches = window.FoodDB.allFoods()
        .filter(f => f.name.toLowerCase().includes(q))
        .slice(0, 12);
      if (!matches.length) { results.style.display = 'none'; return; }
      results.innerHTML = matches.map((f, i) =>
        `<div data-food="${i}">
          <div>${escapeHtml(f.name)} <span class="muted">(${f.per} ${f.unit})</span></div>
          <div class="fr-macros">${f.calories} kcal · P ${f.protein} · C ${f.carbs} · G ${f.fat}</div>
        </div>`).join('');
      results.style.display = 'block';
      results.querySelectorAll('[data-food]').forEach((div, i) => {
        div.addEventListener('click', () => pickFood(matches[i]));
      });
    });
  }

  function pickFood(food) {
    selectedFood = food;
    $('foodResults').style.display = 'none';
    $('foodSearch').value = food.name;
    $('mealName').value = food.name;
    $('mealAmount').value = food.per;
    $('amountHint').textContent = `Valores por ${food.per} ${food.unit}. Ajusta la cantidad y se recalcula.`;
    recomputeFromAmount();
  }

  function recomputeFromAmount() {
    if (!selectedFood) return;
    const amount = num($('mealAmount').value) || 0;
    const scaled = window.FoodDB.scaleFood(selectedFood, amount);
    $('mealCalories').value = scaled.calories;
    $('mealProtein').value = scaled.protein;
    $('mealCarbs').value = scaled.carbs;
    $('mealFat').value = scaled.fat;
  }

  function clearMealForm() {
    selectedFood = null;
    ['mealName', 'mealAmount', 'mealCalories', 'mealProtein', 'mealCarbs', 'mealFat', 'foodSearch'].forEach(id => $(id).value = '');
    $('amountHint').textContent = '';
  }

  // --- Pestaña BÁSCULA ---

  function renderBodyMetrics() {
    const latest = window.Storage.latestMeasurement(state);
    const grid = $('bodyMetrics');
    const p = state.profile;

    if (!latest) {
      grid.innerHTML = '<p class="empty">Registra tu primera medición abajo para ver tu panel corporal.</p>';
      $('scaleLatestDate').textContent = '';
      return;
    }
    $('scaleLatestDate').textContent = 'último: ' + latest.date;

    // Medición anterior para calcular deltas
    const prev = state.measurements.length > 1 ? state.measurements[state.measurements.length - 2] : null;

    const bmi = window.Calc.calcBMI(latest.weightKg, p.heightCm);
    const ffmi = window.Calc.calcFFMI(latest.weightKg, p.heightCm, latest.bodyFatPct);

    const cards = [];
    cards.push(metricCard('Peso', latest.weightKg, 'kg', prev && delta(latest.weightKg, prev.weightKg), true));
    if (latest.bodyFatPct != null) cards.push(metricCard('Grasa corporal', latest.bodyFatPct, '%', prev && delta(latest.bodyFatPct, prev.bodyFatPct), false));
    if (latest.muscleMassKg != null) cards.push(metricCard('Masa muscular', latest.muscleMassKg, 'kg', prev && delta(latest.muscleMassKg, prev.muscleMassKg), true));
    if (bmi != null) cards.push(metricCard('IMC', bmi, window.Calc.bmiCategory(bmi), null, null));
    if (ffmi != null) cards.push(metricCard('FFMI', ffmi, 'masa magra', null, null));
    if (latest.waterPct != null) cards.push(metricCard('Agua corporal', latest.waterPct, '%', null, null));
    if (latest.visceralFat != null) cards.push(metricCard('Grasa visceral', latest.visceralFat, '', prev && delta(latest.visceralFat, prev.visceralFat), false));
    if (latest.boneMassKg != null) cards.push(metricCard('Masa ósea', latest.boneMassKg, 'kg', null, null));
    if (latest.bmr != null) cards.push(metricCard('BMR (báscula)', latest.bmr, 'kcal', null, null));

    grid.innerHTML = cards.join('');
  }

  // higherIsBetter: true (más = verde), false (menos = verde), null (sin color)
  function delta(cur, prev) {
    if (prev == null) return null;
    return Math.round((cur - prev) * 10) / 10;
  }

  function metricCard(label, value, unit, deltaVal, higherIsBetter) {
    let deltaHtml = '';
    if (deltaVal != null && deltaVal !== 0 && higherIsBetter != null) {
      const good = higherIsBetter ? deltaVal > 0 : deltaVal < 0;
      const cls = good ? 'up' : 'down';
      const sign = deltaVal > 0 ? '+' : '';
      deltaHtml = `<div class="delta ${cls}">${sign}${deltaVal} vs. anterior</div>`;
    }
    return `<div class="metric">
      <div class="value">${value}<span class="unit"> ${unit}</span></div>
      <div class="label">${label}</div>
      ${deltaHtml}
    </div>`;
  }

  function renderMeasurementList() {
    const ul = $('measurementList');
    if (!state.measurements.length) {
      ul.innerHTML = '<p class="empty">Sin mediciones registradas.</p>';
      return;
    }
    ul.innerHTML = '';
    [...state.measurements].reverse().forEach(m => {
      const li = document.createElement('li');
      const parts = [`${m.weightKg} kg`];
      if (m.bodyFatPct != null) parts.push(`${m.bodyFatPct}% grasa`);
      if (m.muscleMassKg != null) parts.push(`${m.muscleMassKg} kg músculo`);
      li.innerHTML = `
        <div class="item-main">
          <div class="item-name">${m.date}</div>
          <div class="item-meta">${parts.join(' · ')}</div>
        </div>
        <button class="btn danger" data-del-m="${m.id}">Borrar</button>`;
      ul.appendChild(li);
    });
    ul.querySelectorAll('[data-del-m]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.Storage.deleteMeasurement(state, btn.dataset.delM);
        persist(); renderAll();
      });
    });
  }

  // --- Pestaña PROGRESO ---

  function renderProgress() {
    const ms = state.measurements;
    window.Charts.lineChart($('chartWeight'), [
      { label: 'Peso', color: 'var(--accent)', points: ms.filter(m => m.weightKg != null).map(m => ({ x: m.date, y: m.weightKg })) },
    ]);

    window.Charts.lineChart($('chartComposition'), [
      { label: 'Grasa %', color: 'var(--protein)', points: ms.filter(m => m.bodyFatPct != null).map(m => ({ x: m.date, y: m.bodyFatPct })) },
      { label: 'Músculo kg', color: 'var(--accent-2)', points: ms.filter(m => m.muscleMassKg != null).map(m => ({ x: m.date, y: m.muscleMassKg })) },
    ]);

    // Insight de composición
    renderCompositionInsight();

    // Calorías
    const cals = state.nutrition
      .map(d => ({ x: d.date, y: window.Calc.sumMeals(d.meals).calories }))
      .filter(p => p.y > 0);
    window.Charts.lineChart($('chartCalories'), [
      { label: 'Calorías', color: 'var(--carbs)', points: cals, minY: 0 },
    ]);
  }

  function renderCompositionInsight() {
    const el = $('compositionInsight');
    const withFat = state.measurements.filter(m => m.bodyFatPct != null && m.muscleMassKg != null);
    if (withFat.length < 2) {
      el.textContent = 'Registra grasa y músculo en al menos dos mediciones para ver el análisis de tu recomposición.';
      return;
    }
    const first = withFat[0], last = withFat[withFat.length - 1];
    const fatChange = Math.round((last.bodyFatPct - first.bodyFatPct) * 10) / 10;
    const muscleChange = Math.round((last.muscleMassKg - first.muscleMassKg) * 10) / 10;

    let msg;
    if (muscleChange > 0 && fatChange <= 0) {
      msg = `🎉 ¡Recomposición ideal! Has ganado ${muscleChange} kg de músculo y bajado ${-fatChange} puntos de grasa. Sigue así.`;
    } else if (muscleChange > 0 && fatChange > 0) {
      msg = `💪 Has ganado ${muscleChange} kg de músculo (+${fatChange}% grasa). Para ganar músculo esto es normal; si la grasa sube rápido, reduce un poco el superávit.`;
    } else if (muscleChange <= 0 && fatChange < 0) {
      msg = `🔥 Has perdido ${-fatChange} puntos de grasa. El músculo ha bajado ${-muscleChange} kg: asegura proteína alta y entrenamiento de fuerza.`;
    } else {
      msg = `📊 Grasa ${fatChange > 0 ? '+' : ''}${fatChange}%, músculo ${muscleChange > 0 ? '+' : ''}${muscleChange} kg desde el inicio. Ajusta calorías o entrenamiento según tu objetivo.`;
    }
    el.textContent = msg;
  }

  // --- Import / Export ---

  function download(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  let pendingImportKind = null;
  function triggerImport(kind) {
    pendingImportKind = kind;
    $('fileInput').value = '';
    $('fileInput').click();
  }

  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (pendingImportKind === 'csv') {
          const rows = window.Storage.parseMeasurementsCSV(reader.result);
          if (!rows.length) { toast('No se encontraron mediciones válidas'); return; }
          rows.forEach(r => window.Storage.addMeasurement(state, r));
          persist(); renderAll();
          toast(`${rows.length} mediciones importadas`);
        } else if (pendingImportKind === 'backup') {
          const restored = window.Storage.importBackup(reader.result);
          Object.assign(state, restored);
          persist(); renderProfileForm(); renderAll();
          toast('Copia restaurada');
        }
      } catch (e) {
        toast('Error al importar el archivo');
        console.error(e);
      }
    };
    reader.readAsText(file);
  }

  // --- Navegación de pestañas ---

  function setupTabs() {
    document.querySelectorAll('.tabs button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        $('tab-' + btn.dataset.tab).classList.add('active');
        if (btn.dataset.tab === 'progress') renderProgress();
      });
    });
  }

  // --- Render global ---

  function renderAll() {
    renderToday();
    renderBodyMetrics();
    renderMeasurementList();
    renderTargetsExplain();
    if ($('tab-progress').classList.contains('active')) renderProgress();
  }

  // --- Eventos ---

  function setupEvents() {
    // Perfil
    $('saveProfileBtn').addEventListener('click', () => {
      state.profile.name = $('pName').value.trim();
      state.profile.sex = $('pSex').value;
      state.profile.birthDate = $('pBirth').value;
      state.profile.heightCm = num($('pHeight').value);
      state.profile.activityLevel = $('pActivity').value;
      state.profile.goal = $('pGoal').value;
      persist();
      $('goalBadge').textContent = GOAL_LABELS[state.profile.goal];
      renderAll();
      toast('Perfil guardado');
    });

    // Comidas
    $('mealAmount').addEventListener('input', recomputeFromAmount);
    $('addMealBtn').addEventListener('click', () => {
      const name = $('mealName').value.trim();
      const calories = num($('mealCalories').value);
      if (!name || calories == null) { toast('Pon al menos nombre y calorías'); return; }
      window.Storage.addMeal(state, todayISO(), {
        name,
        calories,
        protein: num($('mealProtein').value) || 0,
        carbs: num($('mealCarbs').value) || 0,
        fat: num($('mealFat').value) || 0,
      });
      persist(); clearMealForm(); renderToday();
      toast('Comida añadida');
    });

    $('saveCustomFoodBtn').addEventListener('click', () => {
      const name = $('mealName').value.trim();
      const amount = num($('mealAmount').value);
      const calories = num($('mealCalories').value);
      if (!name || !amount || calories == null) { toast('Rellena nombre, cantidad y macros'); return; }
      window.FoodDB.saveCustomFood({
        name, unit: 'g', per: amount, calories,
        protein: num($('mealProtein').value) || 0,
        carbs: num($('mealCarbs').value) || 0,
        fat: num($('mealFat').value) || 0,
      });
      toast('Alimento guardado en tu base de datos');
    });

    // Mediciones
    $('addMeasurementBtn').addEventListener('click', () => {
      const date = $('mDate').value || todayISO();
      const weightKg = num($('mWeight').value);
      if (weightKg == null) { toast('El peso es obligatorio'); return; }
      window.Storage.addMeasurement(state, {
        date, weightKg,
        bodyFatPct: num($('mFat').value),
        muscleMassKg: num($('mMuscle').value),
        waterPct: num($('mWater').value),
        boneMassKg: num($('mBone').value),
        visceralFat: num($('mVisceral').value),
        bmr: num($('mBmr').value),
      });
      persist();
      ['mWeight', 'mFat', 'mMuscle', 'mWater', 'mBone', 'mVisceral', 'mBmr'].forEach(id => $(id).value = '');
      renderAll();
      toast('Medición guardada');
    });

    // Import / export
    $('exportCsvBtn').addEventListener('click', () => {
      download('mediciones.csv', window.Storage.exportMeasurementsCSV(state), 'text/csv');
    });
    $('exportBackupBtn').addEventListener('click', () => {
      download('nutritrack-backup.json', window.Storage.exportBackup(state), 'application/json');
    });
    $('importCsvBtn').addEventListener('click', () => triggerImport('csv'));
    $('importBackupBtn').addEventListener('click', () => triggerImport('backup'));
    $('fileInput').addEventListener('change', e => {
      if (e.target.files[0]) handleFile(e.target.files[0]);
    });

    // Coach IA
    $('coachAnalyzeBtn').addEventListener('click', runCoach);
    $('saveKeyBtn').addEventListener('click', () => {
      const key = $('apiKeyInput').value.trim();
      if (!key) { toast('Pega tu API key primero'); return; }
      window.AICoach.setApiKey(key);
      $('apiKeyInput').value = '';
      renderApiKeyStatus();
      toast('API key guardada');
    });
    $('clearKeyBtn').addEventListener('click', () => {
      window.AICoach.setApiKey('');
      $('apiKeyInput').value = '';
      renderApiKeyStatus();
      toast('API key borrada');
    });

    // Withings
    $('saveWorkerBtn').addEventListener('click', () => {
      const url = $('withingsWorkerInput').value.trim();
      if (!url) { toast('Pega la URL del Worker'); return; }
      window.Withings.setWorkerUrl(url);
      renderWithingsStatus();
      toast('URL del Worker guardada');
    });
    $('withingsConnectBtn').addEventListener('click', () => {
      if (!window.Withings.isConfigured()) { toast('Guarda primero la URL del Worker'); return; }
      try { window.Withings.connect(); }
      catch (e) { renderWithingsStatus(window.Withings.errorMessage(e), 'error'); }
    });
    $('withingsImportBtn').addEventListener('click', importWithings);
    $('withingsDisconnectBtn').addEventListener('click', () => {
      window.Withings.disconnect();
      renderWithingsStatus();
      toast('Withings desconectado');
    });
  }

  // --- Coach IA ---

  function renderApiKeyStatus() {
    const has = window.AICoach.hasApiKey();
    const el = $('apiKeyStatus');
    if (has) {
      el.textContent = '✅ Key guardada. El coach está activo.';
      el.style.color = 'var(--accent-2)';
    } else {
      el.textContent = 'Sin key: el coach no puede analizar todavía.';
      el.style.color = 'var(--text-muted)';
    }
  }

  function coachContext() {
    const c = getComputedTargets();
    const date = todayISO();
    const day = state.nutrition.find(d => d.date === date);
    return {
      profile: state.profile,
      latest: window.Storage.latestMeasurement(state),
      targets: c ? c.targets : null,
      age: c ? c.age : window.Calc.ageFromBirthDate(state.profile.birthDate),
      eatenToday: window.Calc.sumMeals(day ? day.meals : []),
    };
  }

  async function runCoach() {
    const text = $('coachInput').value.trim();
    const resultEl = $('coachResult');
    if (!text) { toast('Escribe qué has comido'); return; }
    if (!window.AICoach.hasApiKey()) {
      resultEl.innerHTML = '<div class="coach-error">Configura tu API key de Anthropic en la pestaña <strong>Perfil</strong> para activar el coach.</div>';
      return;
    }

    const btn = $('coachAnalyzeBtn');
    btn.disabled = true;
    resultEl.innerHTML = '<div class="coach-loading"><span class="spinner"></span> Analizando tu comida…</div>';

    try {
      const r = await window.AICoach.analyzeMeal(text, coachContext());

      // Añadir los alimentos detectados al día
      const foods = Array.isArray(r.foods) ? r.foods : [];
      foods.forEach(f => {
        window.Storage.addMeal(state, todayISO(), {
          name: f.name,
          calories: Math.round(Number(f.calories) || 0),
          protein: Number(f.protein) || 0,
          carbs: Number(f.carbs) || 0,
          fat: Number(f.fat) || 0,
        });
      });
      persist();

      const verdict = (r.verdict || 'buena').toLowerCase();
      const proteinLabel = { baja: '🔴 Proteína baja', correcta: '🟢 Proteína correcta', alta: '🟢 Proteína alta' }[r.protein_status] || '';
      const suggestions = Array.isArray(r.suggestions) ? r.suggestions : [];

      resultEl.innerHTML = `
        <div class="coach-result">
          <span class="coach-verdict ${escapeHtml(verdict)}">Comida ${escapeHtml(verdict)}</span>
          ${proteinLabel ? `<span class="coach-verdict" style="background:var(--surface-2);color:var(--text-muted)">${proteinLabel}</span>` : ''}
          <div class="coach-assessment">${escapeHtml(r.assessment || '')}</div>
          ${suggestions.length ? `<ul class="coach-suggestions">${suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>` : ''}
          <div class="coach-foods muted">Añadido a tu día: ${foods.map(f => escapeHtml(f.name)).join(', ') || '—'}</div>
        </div>`;
      $('coachInput').value = '';
      renderToday();
    } catch (err) {
      resultEl.innerHTML = `<div class="coach-error">${escapeHtml(window.AICoach.errorMessage(err))}</div>`;
    } finally {
      btn.disabled = false;
    }
  }

  // --- Withings ---

  function renderWithingsStatus(msg, kind) {
    const el = $('withingsStatus');
    if (msg) {
      el.textContent = msg;
      el.style.color = kind === 'error' ? 'var(--danger)' : kind === 'ok' ? 'var(--accent-2)' : 'var(--text-muted)';
      return;
    }
    if (window.Withings.isConnected()) {
      el.textContent = '✅ Cuenta de Withings conectada. Pulsa "Importar mediciones".';
      el.style.color = 'var(--accent-2)';
    } else if (window.Withings.isConfigured()) {
      el.textContent = 'Worker configurado. Pulsa "Conectar con Withings" para autorizar.';
      el.style.color = 'var(--text-muted)';
    } else {
      el.textContent = 'Sin configurar. Pega la URL de tu Worker y guarda.';
      el.style.color = 'var(--text-muted)';
    }
    $('withingsWorkerInput').value = window.Withings.getWorkerUrl();
  }

  async function importWithings() {
    const btn = $('withingsImportBtn');
    btn.disabled = true;
    renderWithingsStatus('Importando de Withings…', 'neutral');
    try {
      const rows = await window.Withings.importMeasurements();
      if (!rows.length) {
        renderWithingsStatus('No se encontraron mediciones nuevas en Withings.', 'neutral');
        return;
      }
      rows.forEach(r => window.Storage.addMeasurement(state, r));
      persist();
      renderAll();
      renderWithingsStatus(`✅ ${rows.length} mediciones importadas de Withings.`, 'ok');
      toast(`${rows.length} mediciones importadas`);
    } catch (err) {
      renderWithingsStatus(window.Withings.errorMessage(err), 'error');
    } finally {
      btn.disabled = false;
    }
  }

  // --- Init ---
  function init() {
    $('mDate').value = todayISO();
    renderProfileForm();
    setupTabs();
    setupFoodSearch();
    setupEvents();
    renderApiKeyStatus();

    // Procesa la vuelta del login de Withings, si la hay
    const cb = window.Withings.consumeCallback();
    if (cb === 'connected') toast('Withings conectado');
    else if (cb && cb.startsWith('error:')) toast('Error de Withings: ' + cb.slice(6));
    renderWithingsStatus();

    renderAll();

    // Si acabamos de conectar, importamos automáticamente
    if (cb === 'connected') importWithings();
  }

  init();
})();
