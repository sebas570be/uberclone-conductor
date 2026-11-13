// backend/src/services/mercadoPagoService.js
// Única parte del proyecto que habla con Mercado Pago. Usa el Access Token
// (secreto) que solo vive en backend/.env.
const { CONFIG } = require('../config');
const { pickCheckoutUrl } = require('../utils/payment');

function requireAccessToken() {
  if (!CONFIG.mercadoPagoAccessToken) {
    throw new Error('Falta MP_ACCESS_TOKEN en backend/.env (mira backend/.env.example).');
  }
  return CONFIG.mercadoPagoAccessToken;
}

// Llamada a la API de Mercado Pago con límite de tiempo. SIN reintento: un
// POST repetido podría crear dos preferencias para el mismo viaje.
async function mercadoPagoRequest(path, options = {}) {
  const response = await fetch(`${CONFIG.mercadoPagoBaseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${requireAccessToken()}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    signal: AbortSignal.timeout(CONFIG.requestTimeoutMs),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    // Se muestra el mensaje de Mercado Pago, nunca el token.
    throw new Error(`Mercado Pago respondió ${response.status}: ${data?.message ?? 'sin detalle'}`);
  }
  return data;
}

// Crea la preferencia de Checkout Pro para UN viaje (G4).
// El monto sale del viaje guardado en Firestore, NO de lo que mande la app.
// external_reference = id del viaje: así después se encuentra su pago.
async function createPreference(trip) {
  const preference = await mercadoPagoRequest('/checkout/preferences', {
    method: 'POST',
    body: JSON.stringify({
      items: [
        {
          id: trip.id,
          title: 'Viaje UberClone',
          description: `${trip.distanceKm} km · ${trip.durationMin} min`,
          quantity: 1,
          unit_price: trip.fare,
          currency_id: CONFIG.currency,
        },
      ],
      external_reference: trip.id,
    }),
  });
  return { preferenceId: preference?.id, checkoutUrl: pickCheckoutUrl(preference) };
}

// Pagos de un viaje, del más reciente al más antiguo (G6: "retorno").
async function findPaymentsForTrip(tripId) {
  const query = new URLSearchParams({
    external_reference: tripId,
    sort: 'date_created',
    criteria: 'desc',
  });
  const data = await mercadoPagoRequest(`/v1/payments/search?${query}`);
  return Array.isArray(data?.results) ? data.results : [];
}

module.exports = { createPreference, findPaymentsForTrip };
