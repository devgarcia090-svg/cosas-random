/*
 * food-api.js — Búsqueda de alimentos en Open Food Facts.
 *
 * Base de datos abierta, gratis y sin clave, con millones de alimentos y
 * productos (incluidos los de supermercados españoles). Devuelve los macros
 * por 100 g, listos para el buscador de la app.
 *
 * Funciona desde el navegador y desde la APK (la API permite CORS).
 * Si no hay internet, el buscador se queda con la lista local integrada.
 */
(function () {
  'use strict';

  const ENDPOINT = 'https://world.openfoodfacts.org/cgi/search.pl';
  const FIELDS = 'product_name,product_name_es,brands,nutriments,code';

  function round1(n) { return Math.round(n * 10) / 10; }

  function kcalFrom(n) {
    if (n['energy-kcal_100g'] != null) return Number(n['energy-kcal_100g']);
    // Si solo viene en kJ, convertimos
    const kj = n['energy-kj_100g'] != null ? n['energy-kj_100g'] : n['energy_100g'];
    if (kj != null) return Number(kj) / 4.184;
    return null;
  }

  function normalize(product) {
    const n = product.nutriments || {};
    const kcal = kcalFrom(n);
    const name = (product.product_name_es || product.product_name || '').trim();
    if (!name || kcal == null || !(kcal > 0)) return null; // sin datos útiles
    const brand = (product.brands || '').split(',')[0].trim();
    return {
      name: brand ? `${name} (${brand})` : name,
      unit: 'g',
      per: 100,
      calories: Math.round(kcal),
      protein: round1(Number(n.proteins_100g) || 0),
      carbs: round1(Number(n.carbohydrates_100g) || 0),
      fat: round1(Number(n.fat_100g) || 0),
      source: 'off',
    };
  }

  // Busca alimentos. Devuelve [] si falla (sin romper el buscador local).
  async function search(query, { limit = 15, signal } = {}) {
    const q = (query || '').trim();
    if (q.length < 2) return [];

    const url = `${ENDPOINT}?search_terms=${encodeURIComponent(q)}`
      + `&search_simple=1&action=process&json=1&page_size=25&fields=${FIELDS}`;

    // Timeout propio (además del signal externo si lo hay)
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    if (signal) signal.addEventListener('abort', () => ctrl.abort());

    try {
      const res = await fetch(url, { signal: ctrl.signal, headers: { 'Accept': 'application/json' } });
      if (!res.ok) return [];
      const data = await res.json();
      const products = Array.isArray(data.products) ? data.products : [];
      const out = [];
      const seen = new Set();
      for (const p of products) {
        const f = normalize(p);
        if (!f) continue;
        const key = f.name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(f);
        if (out.length >= limit) break;
      }
      return out;
    } catch {
      return []; // sin conexión o cancelado
    } finally {
      clearTimeout(timer);
    }
  }

  window.FoodAPI = { search };
})();
