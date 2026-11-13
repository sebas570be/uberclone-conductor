// backend/test/pushMessage.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildTripRequestMessage, isTokenGone } = require('../src/utils/pushMessage');

const BASE = {
  token: 'token-de-prueba',
  tripId: 'abc123',
  distanceKm: 4.1,
  durationMin: 8,
  ttlMs: 20000,
  channelId: 'trip-requests',
};

test('español: título y texto con distancia y duración', () => {
  const message = buildTripRequestMessage({ ...BASE, language: 'es' });
  assert.equal(message.notification.title, 'Nueva solicitud de viaje');
  assert.equal(message.notification.body, '4.1 km · 8 min. Abre la app para responder.');
});

test('inglés: textos en inglés', () => {
  const message = buildTripRequestMessage({ ...BASE, language: 'en' });
  assert.equal(message.notification.title, 'New trip request');
  assert.equal(message.notification.body, '4.1 km · 8 min. Open the app to respond.');
});

test('idioma desconocido o vacío: español', () => {
  assert.equal(buildTripRequestMessage({ ...BASE, language: 'fr' }).notification.title, 'Nueva solicitud de viaje');
  assert.equal(buildTripRequestMessage({ ...BASE, language: undefined }).notification.title, 'Nueva solicitud de viaje');
});

test('Android: prioridad alta, vence con la solicitud y usa el canal de la app', () => {
  const message = buildTripRequestMessage({ ...BASE, language: 'es' });
  assert.deepEqual(message.android, { priority: 'high', ttl: 20000, notification: { channelId: 'trip-requests' } });
  assert.equal(message.token, 'token-de-prueba');
});

test('data.tripId siempre es texto (FCM no acepta números en data)', () => {
  assert.deepEqual(buildTripRequestMessage({ ...BASE, tripId: 42, language: 'es' }).data, { tripId: '42' });
});

test('token vencido o inválido: se borra; otros errores no', () => {
  assert.equal(isTokenGone({ code: 'messaging/registration-token-not-registered' }), true);
  assert.equal(isTokenGone({ code: 'messaging/invalid-registration-token' }), true);
  assert.equal(isTokenGone({ code: 'messaging/internal-error' }), false);
  assert.equal(isTokenGone(undefined), false);
});
