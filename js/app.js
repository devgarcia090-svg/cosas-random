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

      // Desglose claro por macro: llevas / objetivo · te faltan
      const macroRow = (emoji, label, val, target, unit, color) => {
        const left = Math.round((target - val) * 10) / 10;
        const over = left < 0;
        const pct = Math.min(100, target > 0 ? Math.round(val / target * 100) : 0);
        return `<div class="mt-row">
          <div class="mt-head">
            <span class="mt-label">${emoji} ${label}</span>
            <span class="mt-val"><strong>${Math.round(val)}</strong> / ${Math.round(target)} ${unit}</span>
          </div>
          <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${pct}%;background:${over ? 'var(--danger)' : color}"></div></div>
          <div class="mt-left ${over ? 'over' : ''}">${over ? `Te has pasado ${-left} ${unit}` : `Te faltan <strong>${left} ${unit}</strong> para tu objetivo`}</div>
        </div>`;
      };
      $('calorieBar').innerHTML = `
        <div class="macro-targets">
          ${macroRow('🔥', 'Calorías', eaten.calories, t.calories, 'kcal', 'var(--accent-2)')}
          ${macroRow('🥩', 'Proteína', eaten.protein, t.protein, 'g', 'var(--protein)')}
          ${macroRow('🍚', 'Carbos', eaten.carbs, t.carbs, 'g', 'var(--carbs)')}
          ${macroRow('🥑', 'Grasa', eaten.fat, t.fat, 'g', 'var(--fat)')}
        </div>`;
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
    let seq = 0;
    let debounce;

    function render(matches) {
      if (!matches.length) { results.style.display = 'none'; return; }
      results.innerHTML = matches.map((f, i) =>
        `<div data-food="${i}">
          <div>${escapeHtml(f.name)} <span class="muted">(${f.per} ${f.unit})</span>${f.source === 'off' ? ' <span class="src-tag">OFF</span>' : ''}</div>
          <div class="fr-macros">${f.calories} kcal · P ${f.protein} · C ${f.carbs} · G ${f.fat}</div>
        </div>`).join('');
      results.style.display = 'block';
      results.querySelectorAll('[data-food]').forEach((div, i) => {
        div.addEventListener('click', () => pickFood(matches[i]));
      });
    }

    input.addEventListener('input', () => {
      const q = input.value.trim();
      clearTimeout(debounce);
      if (!q) { results.style.display = 'none'; return; }
      const mySeq = ++seq;

      // 1) Resultados de la lista local (instantáneo)
      const local = window.FoodDB.allFoods()
        .filter(f => f.name.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 8);
      render(local);

      // 2) Open Food Facts (con debounce; base de datos enorme)
      debounce = setTimeout(async () => {
        const online = await window.FoodAPI.search(q);
        if (mySeq !== seq) return; // hay una búsqueda más reciente
        const seen = new Set(local.map(f => f.name.toLowerCase()));
        const merged = local.concat(online.filter(f => !seen.has(f.name.toLowerCase()))).slice(0, 20);
        render(merged);
      }, 350);
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
    renderWeeklySummary();
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
    renderQuickMeals();
    renderBodyMetrics();
    renderMeasurementList();
    renderTargetsExplain();
    if ($('tab-progress').classList.contains('active')) renderProgress();
  }

  // --- Comidas rápidas (recientes/favoritas) ---

  function renderQuickMeals() {
    const card = $('quickMealsCard');
    const el = $('quickMeals');
    const list = window.Storage.quickMeals(state, 10);
    if (!list.length) { card.style.display = 'none'; return; }
    card.style.display = 'block';
    el.innerHTML = list.map(m => `
      <div class="qm-chip">
        <button class="qm-star ${m.fav ? 'on' : ''}" data-fav="${m.id}" title="Favorito">${m.fav ? '★' : '☆'}</button>
        <button class="qm-add" data-add="${m.id}">
          <span class="qm-name">${escapeHtml(m.name)}</span>
          <span class="qm-macros">${m.calories} kcal · P ${m.protein}g</span>
        </button>
        <button class="qm-del" data-del="${m.id}" title="Quitar">✕</button>
      </div>`).join('');
    el.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', () => quickAdd(b.dataset.add)));
    el.querySelectorAll('[data-fav]').forEach(b => b.addEventListener('click', () => {
      window.Storage.toggleFavMeal(state, b.dataset.fav); persist(); renderQuickMeals();
    }));
    el.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
      window.Storage.deleteRecentMeal(state, b.dataset.del); persist(); renderQuickMeals();
    }));
  }

  function quickAdd(id) {
    const m = (state.recentMeals || []).find(x => x.id === id);
    if (!m) return;
    const meal = { name: m.name, calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat };
    window.Storage.addMeal(state, todayISO(), meal);
    window.Storage.rememberMeal(state, meal); // sube su posición (más reciente)
    persist(); renderToday(); renderQuickMeals();
    toast('Añadido: ' + m.name);
  }

  // --- Escáner de código de barras (APK) ---

  async function scanFood() {
    if (!(window.NativeExtras && window.NativeExtras.available)) return;
    const btn = $('scanBtn');
    btn.disabled = true;
    try {
      const code = await window.NativeExtras.scanBarcode();
      if (!code) { toast('No se leyó ningún código de barras'); return; }
      toast('Buscando producto…');
      const food = await window.FoodAPI.getByBarcode(code);
      if (!food) { toast(`Código ${code}: no está en Open Food Facts. Búscalo por nombre.`); return; }
      pickFood(food);
      toast('Cargado: ' + food.name);
    } catch (e) {
      // Mostramos el motivo real para poder diagnosticar
      toast(e && e.message ? e.message : 'No se pudo escanear');
    } finally {
      btn.disabled = false;
    }
  }

  // --- Resumen semanal (pestaña Progreso) ---

  function last7Dates() {
    const out = [];
    const t = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(t);
      d.setDate(d.getDate() - i);
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  }

  function renderWeeklySummary() {
    const el = $('weeklySummary');
    const set = new Set(last7Dates());
    const daysWithFood = state.nutrition
      .filter(d => set.has(d.date))
      .filter(d => window.Calc.sumMeals(d.meals).calories > 0);

    if (!daysWithFood.length) {
      el.innerHTML = '<p class="muted">Aún no hay comidas registradas esta semana.</p>';
      return;
    }
    const tot = daysWithFood.reduce((a, d) => {
      const s = window.Calc.sumMeals(d.meals);
      return { cal: a.cal + s.calories, p: a.p + s.protein, c: a.c + s.carbs, f: a.f + s.fat };
    }, { cal: 0, p: 0, c: 0, f: 0 });
    const n = daysWithFood.length;
    const avg = k => Math.round(tot[k] / n);

    const wm = state.measurements.filter(m => set.has(m.date));
    let weightCard = '';
    if (wm.length >= 2) {
      const ch = Math.round((wm[wm.length - 1].weightKg - wm[0].weightKg) * 10) / 10;
      weightCard = `<div class="metric"><div class="value">${ch > 0 ? '+' : ''}${ch}<span class="unit"> kg</span></div><div class="label">Peso (esta semana)</div></div>`;
    }

    el.innerHTML = `
      <div class="metric-grid">
        <div class="metric"><div class="value">${avg('cal')}<span class="unit"> kcal</span></div><div class="label">Calorías/día (media)</div></div>
        <div class="metric"><div class="value">${avg('p')}<span class="unit"> g</span></div><div class="label">Proteína/día (media)</div></div>
        <div class="metric"><div class="value">${avg('c')}<span class="unit"> g</span></div><div class="label">Carbos/día (media)</div></div>
        <div class="metric"><div class="value">${avg('f')}<span class="unit"> g</span></div><div class="label">Grasa/día (media)</div></div>
        ${weightCard}
      </div>
      <p class="muted mt">Media de ${n} día(s) con comidas registradas en los últimos 7 días.</p>`;
  }

  // --- Recordatorio de proteína (APK) ---

  const REMINDER_KEY = 'nutritrack_reminder_v1';
  function getReminderSetting() {
    try { return JSON.parse(localStorage.getItem(REMINDER_KEY)) || {}; } catch { return {}; }
  }
  function setReminderSetting(s) { localStorage.setItem(REMINDER_KEY, JSON.stringify(s)); }

  function renderReminderUI() {
    const card = $('reminderCard');
    if (!(window.NativeExtras && window.NativeExtras.available)) { card.style.display = 'none'; return; }
    card.style.display = 'block';
    const s = getReminderSetting();
    if (s.time) $('reminderTime').value = s.time;
    const st = $('reminderStatus');
    st.textContent = s.enabled ? `✅ Activo cada día a las ${s.time}` : 'Desactivado.';
    st.style.color = s.enabled ? 'var(--accent-2)' : 'var(--text-muted)';
  }

  async function enableReminder() {
    const time = $('reminderTime').value || '20:00';
    const [h, m] = time.split(':').map(Number);
    const c = getComputedTargets();
    const proteinTarget = c ? c.targets.protein : null;
    try {
      await window.NativeExtras.scheduleProteinReminder(h, m, proteinTarget);
      setReminderSetting({ enabled: true, time });
      renderReminderUI();
      toast('Recordatorio activado');
    } catch (e) {
      const st = $('reminderStatus');
      st.textContent = e && e.message === 'NO_NOTIF' ? 'Permiso de notificaciones denegado.' : 'No se pudo activar el recordatorio.';
      st.style.color = 'var(--danger)';
    }
  }

  async function disableReminder() {
    try { await window.NativeExtras.cancelProteinReminder(); } catch { /* ignore */ }
    setReminderSetting({ enabled: false, time: $('reminderTime').value });
    renderReminderUI();
    toast('Recordatorio desactivado');
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
      const meal = {
        name,
        calories,
        protein: num($('mealProtein').value) || 0,
        carbs: num($('mealCarbs').value) || 0,
        fat: num($('mealFat').value) || 0,
      };
      window.Storage.addMeal(state, todayISO(), meal);
      window.Storage.rememberMeal(state, meal);
      persist(); clearMealForm(); renderToday(); renderQuickMeals();
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

    // Báscula Bluetooth
    $('btReadBtn').addEventListener('click', readBluetoothScale);

    // Escáner de código de barras + recordatorio (APK)
    $('scanBtn').addEventListener('click', scanFood);
    $('reminderOnBtn').addEventListener('click', enableReminder);
    $('reminderOffBtn').addEventListener('click', disableReminder);
  }

  // --- Báscula Bluetooth ---
  // Prioriza el lector NATIVO (APK, básculas estándar tipo Beurer BF500);
  // si no está, usa Web Bluetooth (Xiaomi Mi 2 en Chrome Android/PC).

  function pickScaleReader() {
    if (window.ScaleBLE && window.ScaleBLE.native) return window.ScaleBLE;
    if (window.MiScale && window.MiScale.bluetoothAvailable()) return window.MiScale;
    return null;
  }

  async function readBluetoothScale() {
    const btn = $('btReadBtn');
    const status = $('btStatus');
    const reader = pickScaleReader();
    if (!reader) {
      status.textContent = 'Bluetooth no disponible aquí. Instala la app (APK) en tu Android, o usa Chrome en Android/PC.';
      status.style.color = 'var(--danger)';
      return;
    }
    btn.disabled = true;
    status.textContent = 'Selecciona tu báscula y súbete a ella…';
    status.style.color = 'var(--text-muted)';
    try {
      const reading = await reader.readOnce({
        heightCm: state.profile.heightCm,
        age: window.Calc.ageFromBirthDate(state.profile.birthDate),
        sex: state.profile.sex,
      });
      if (!reading || reading.weightKg == null) throw new Error('EMPTY');
      // Rellenamos el formulario para que el usuario revise y guarde
      $('mDate').value = todayISO();
      $('mWeight').value = reading.weightKg;
      if (reading.bodyFatPct != null) $('mFat').value = reading.bodyFatPct;
      if (reading.muscleMassKg != null) $('mMuscle').value = reading.muscleMassKg;
      if (reading.waterPct != null) $('mWater').value = reading.waterPct;
      if (reading.bmr != null) $('mBmr').value = reading.bmr;
      status.textContent = `✅ Leído: ${reading.weightKg} kg${reading.bodyFatPct != null ? ` · ${reading.bodyFatPct}% grasa` : ''}. Revisa y pulsa "Guardar medición".`;
      status.style.color = 'var(--accent-2)';
      toast('Báscula leída');
    } catch (err) {
      status.textContent = reader.errorMessage(err);
      status.style.color = 'var(--danger)';
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
    // Funciones solo disponibles en la APK
    if (window.NativeExtras && window.NativeExtras.available) {
      $('scanBtn').style.display = '';
    }
    renderReminderUI();
    renderAll();
  }

  init();
})();
