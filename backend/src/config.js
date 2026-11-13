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

  // Servidor de pagos (Express). 0.0.0.0 = acepta conexiones de la red local
  // (el iPhone en el mismo Wi-Fi), no solo del propio PC.
  port: Number(process.env.PORT) || 3000,
  host: '0.0.0.0',

  // Mercado Pago: el Access Token es SECRETO (solo en backend/.env, nunca en
  // la app ni en Git). Es el de la cuenta VENDEDOR DE PRUEBA (APP_USR-...).
  mercadoPagoAccessToken: process.env.MP_ACCESS_TOKEN,
  mercadoPagoBaseUrl: 'https://api.mercadopago.com',
  currency: 'COP',

  // APIs públicas y gratuitas (sin llave): las permite el enunciado (§7).
  osrmBaseUrl: 'https://router.project-osrm.org',
  nominatimBaseUrl: 'https://nominatim.openstreetmap.org',
  // Nominatim exige que cada programa se identifique (política de uso).
  userAgent: 'UberCloneConductor/1.0 (proyecto academico de Desarrollo Movil)',
  requestTimeoutMs: 10000,
  nominatimDelayMs: 1100, // Nominatim: máximo 1 consulta por segundo

  // Ubicación de hace máximo 5 min. La app solo envía la ubicación abierta: un
  // conductor Disponible con la app en segundo plano deja de enviarla, pero
  // igual recibe la solicitud por notificación push (antes eran 30 s).
  staleAfterMs: 5 * 60 * 1000,

  // Notificación push (FCM). Vence a los 20 s: los 15 s para responder más los
  // 5 s de margen que aceptan las reglas. Después la solicitud ya no sirve.
  pushTtlMs: 20000,
  // Mismo canal que crea la app (src/services/pushService.js).
  pushChannelId: 'trip-requests',

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
