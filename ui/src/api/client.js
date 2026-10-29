import { normalizar } from './normalize.js';
import { seed } from './mockData.js';

export const USE_MOCK = String(import.meta.env.VITE_USE_MOCK).toLowerCase() === 'true';
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export class ApiError extends Error { constructor(msg, status) { super(msg); this.status = status; } }

async function http(path, opts = {}) {
  let res;
  try {
    res = await fetch(BASE + path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  } catch {
    throw new ApiError(`No se pudo conectar con la API (${BASE}). Verifique que el servidor esté activo y permita CORS.`, 0);
  }
  if (res.status === 204) return null;
  let data = null;
  try { data = await res.json(); } catch { /* sin cuerpo */ }
  if (!res.ok) throw new ApiError(data?.error || `Error ${res.status} en la API`, res.status);
  return data;
}

const limpiar = (c) => ({
  nombre: c.nombre?.trim() ?? '', direccion: c.direccion?.trim() ?? '', especialidad: c.especialidad?.trim() ?? '',
  imagenUrl: c.imagenUrl?.trim() || null, sitioWeb: c.sitioWeb?.trim() || null,
});

const realApi = {
  listar: (q = '') => http(`/api/casas${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`),
  obtener: (id) => http(`/api/casas/${encodeURIComponent(id)}`),
  crear: (c) => http('/api/casas', { method: 'POST', body: JSON.stringify(limpiar(c)) }),
  actualizar: (id, c) => http(`/api/casas/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(limpiar(c)) }),
  eliminar: (id) => http(`/api/casas/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

// ---- Modo MOCK: en memoria, imita el contrato v1 (incluye 400/404/409) ----
let db = seed();
let nextId = db.length + 1;
const espera = (v) => new Promise((r) => setTimeout(() => r(structuredClone(v)), 250));
const falla = (msg, st) => new Promise((_, rej) => setTimeout(() => rej(new ApiError(msg, st)), 250));
function validar(c, idActual) {
  if (!c.nombre || !c.direccion || !c.especialidad) return ['Faltan datos obligatorios: nombre, dirección y especialidad', 400];
  const nb = normalizar(c.nombre);
  if (db.some((x) => normalizar(x.nombre) === nb && x.id !== idActual)) return ['Ya existe una casa con ese nombre', 409];
  return null;
}
const mockApi = {
  listar: (q = '') => { const n = normalizar(q); return espera(n ? db.filter((c) => normalizar(c.nombre).includes(n)) : db); },
  obtener: (id) => { const c = db.find((x) => x.id === id); return c ? espera(c) : falla('Casa no encontrada', 404); },
  crear: (c) => { const d = limpiar(c); const e = validar(d); if (e) return falla(...e);
    const nueva = { id: String(nextId++), ...d }; db.push(nueva); return espera(nueva); },
  actualizar: (id, c) => { const i = db.findIndex((x) => x.id === id); if (i < 0) return falla('Casa no encontrada', 404);
    const d = limpiar(c); const e = validar(d, id); if (e) return falla(...e); db[i] = { id, ...d }; return espera(db[i]); },
  eliminar: (id) => { const i = db.findIndex((x) => x.id === id); if (i < 0) return falla('Casa no encontrada', 404);
    db.splice(i, 1); return espera(null); },
};

export const api = USE_MOCK ? mockApi : realApi;
