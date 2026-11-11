// backend/src/services/httpClient.js
// Un solo lugar para las llamadas HTTP del backend (OSRM, Nominatim):
// identificación, timeout, reintento y causa real del error. Así todos los
// servicios se comportan igual y el reintento no se copia en cada uno.
// AI-assisted: see docs/AI_LOG.md #10
const { CONFIG } = require('../config');

// Errores pasajeros del servidor: vale la pena reintentar.
// 429 = demasiadas consultas; 5xx = el servidor tuvo un problema.
const RETRYABLE_STATUS = Object.freeze([429, 500, 502, 503, 504]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// "fetch failed" solo dice que falló; error.cause dice POR QUÉ (ej. ECONNRESET).
function describeError(error) {
  return error.cause?.code ? `${error.message}: ${error.cause.code}` : error.message;
}

// GET que devuelve el JSON de la respuesta. Por defecto: 1 intento + 1 reintento,
// esperando 1,1 s entre ellos (respeta el límite de 1 consulta/s de Nominatim).
async function fetchJson(url, { attempts = 2, delayMs = CONFIG.nominatimDelayMs, label = 'API' } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': CONFIG.userAgent }, // Nominatim exige identificarse
        signal: AbortSignal.timeout(CONFIG.requestTimeoutMs), // no esperar para siempre
      });
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        error.retryable = RETRYABLE_STATUS.includes(response.status);
        throw error;
      }
      return await response.json();
    } catch (error) {
      // Un 400 o 404 no se arregla reintentando (la petición está mal): se falla de una vez.
      const canRetry = error.retryable !== false && attempt < attempts;
      if (!canRetry) throw new Error(`${label} no respondió (${describeError(error)})`);
      console.warn(`${label} falló (${describeError(error)}); reintentando...`);
      await sleep(delayMs);
    }
  }
  throw new Error(`${label} no respondió`); // no se llega aquí; evita devolver undefined
}

module.exports = { fetchJson, describeError };
