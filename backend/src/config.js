// backend/src/config.js
// Valores del simulador en un solo lugar (como src/config/location.js en la app).
// Lo único que viene de backend/.env es la RUTA de la llave: la llave misma
// nunca se escribe en el código ni se sube a Git.
// AI-assisted: see docs/AI_LOG.md #10
const path = require('path');

// quiet: true → dotenv no imprime mensajes al cargar el .env.
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const CONFIG = Object.freeze({
  serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,

  // APIs públicas y gratuitas (sin llave): las permite el enunciado (§7).
  osrmBaseUrl: 'https://router.project-osrm.org',
  nominatimBaseUrl: 'https://nominatim.openstreetmap.org',
  // Nominatim exige que cada programa se identifique (política de uso).
  userAgent: 'UberCloneConductor/1.0 (proyecto academico de Desarrollo Movil)',
  requestTimeoutMs: 10000,
  nominatimDelayMs: 1100, // Nominatim: máximo 1 consulta por segundo

  // Igual a LOCATION.staleAfterMs de la app: un conductor que no envía
  // ubicación hace más de 30 s se considera desconectado.
  staleAfterMs: 30000,

  // Origen cerca del conductor y destino a unos km del origen (en línea recta).
  pickupDistanceMeters: Object.freeze({ min: 200, max: 1000 }),
  tripDistanceMeters: Object.freeze({ min: 2000, max: 6000 }),

  // Mismos códigos que la app (pricing.js y registrationOptions.js).
  categories: Object.freeze(['economy', 'xl', 'premium']),
  paymentMethods: Object.freeze(['mercadopago', 'cash']),
  // Un conductor con un viaje en alguno de estos estados está ocupado.
  activeStatuses: Object.freeze(['requested', 'accepted', 'driver_arriving', 'in_progress']),

  // No hay app del pasajero: todas las solicitudes las "pide" este pasajero simulado.
  simulatedPassengerId: 'simulated-passenger',
});

module.exports = { CONFIG };
