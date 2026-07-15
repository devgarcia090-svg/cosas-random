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

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // Una petición al buscador de OFF. Devuelve array (posiblemente []) o lanza.
  async function fetchSearch(q, limit) {
    const url = `${ENDPOINT}?search_terms=${encodeURIComponent(q)}`
      + `&search_simple=1&action=process&json=1&page_size=20&fields=${FIELDS}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 9000);
    try {
      const res = await fetch(url, { signal: ctrl.signal, headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status); // 503, etc → reintentar
      const data = await res.json(); // si viene HTML (error), lanza → reintentar
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
    } finally {
      clearTimeout(timer);
    }
  }

  // Busca alimentos. El servidor de OFF a veces devuelve 503; reintentamos un
  // par de veces. Devuelve [] si sigue fallando (el buscador local no se rompe).
  async function search(query, { limit = 15 } = {}) {
    const q = (query || '').trim();
    if (q.length < 2) return [];
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await fetchSearch(q, limit);
      } catch {
        if (attempt < 2) await sleep(500 * (attempt + 1));
      }
    }
    return [];
  }

  // Busca un producto por su código de barras (para el escáner de la APK).
  async function getByBarcode(code) {
    const c = String(code || '').replace(/\D/g, '');
    if (!c) return null;
    const url = `https://world.openfoodfacts.org/api/v2/product/${c}.json?fields=${FIELDS}`;
    try {
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.status !== 1 || !data.product) return null;
      return normalize(data.product);
    } catch {
      return null;
    }
  }

  window.FoodAPI = { search, getByBarcode };
})();
