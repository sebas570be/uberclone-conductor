// backend/src/utils/pushMessage.js
// Mensaje de la notificación push de una solicitud nueva (enunciado §7, FCM).
// Funciones puras: no tocan Firebase, así que se prueban solas (npm test).

// Textos en el idioma del conductor (drivers.language), como la app.
const TEXTS = Object.freeze({
  es: Object.freeze({
    title: 'Nueva solicitud de viaje',
    body: (km, min) => `${km} km · ${min} min. Abre la app para responder.`,
  }),
  en: Object.freeze({
    title: 'New trip request',
    body: (km, min) => `${km} km · ${min} min. Open the app to respond.`,
  }),
});

// Mensaje para getMessaging().send():
// - priority 'high': Android la entrega aunque el celular esté en reposo.
// - ttl: si no llega a tiempo, FCM la descarta (la solicitud ya habría vencido).
// - channelId: el canal que crea la app (importancia alta: suena y se muestra).
// - data.tripId: FCM solo acepta textos en data.
function buildTripRequestMessage({ token, tripId, language, distanceKm, durationMin, ttlMs, channelId }) {
  const texts = TEXTS[language] ?? TEXTS.es;
  return {
    token,
    notification: { title: texts.title, body: texts.body(distanceKm, durationMin) },
    data: { tripId: String(tripId) },
    android: { priority: 'high', ttl: ttlMs, notification: { channelId } },
  };
}

// Errores de FCM que significan que el token ya no sirve (app desinstalada o
// token renovado): ese token se borra para no seguir intentando.
const GONE_TOKEN_CODES = Object.freeze([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

function isTokenGone(error) {
  return GONE_TOKEN_CODES.includes(error?.code);
}

module.exports = { buildTripRequestMessage, isTokenGone };
