// backend/src/services/tripPaymentService.js
// Reglas del cobro por Mercado Pago, del lado del servidor. firebase-admin se
// salta las reglas de Firestore, así que aquí se revisa todo:
// el viaje existe, es de ESTE conductor, está finalizado, es por Mercado Pago
// y la tarifa es válida.
const { FieldValue } = require('firebase-admin/firestore');
const { db } = require('../firebaseAdmin');
const { CONFIG } = require('../config');
const { PAYMENT_STATUS, summarizePayments } = require('../utils/payment');
const { createPreference, findPaymentsForTrip } = require('./mercadoPagoService');

// Error con código HTTP para que la ruta responda bien (404, 403, 409...).
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function getDriverTrip(tripId, uid) {
  if (typeof tripId !== 'string' || !/^[A-Za-z0-9]{1,64}$/.test(tripId)) {
    throw new HttpError(400, 'Viaje inválido.');
  }
  const snapshot = await db.collection('trips').doc(tripId).get();
  if (!snapshot.exists) throw new HttpError(404, 'El viaje no existe.');
  const trip = { id: snapshot.id, ...snapshot.data() };
  if (trip.driverId !== uid) throw new HttpError(403, 'Este viaje no es tuyo.');
  if (trip.paymentMethod !== 'mercadopago') throw new HttpError(409, 'Este viaje no se paga con Mercado Pago.');
  if (!Number.isInteger(trip.fare) || trip.fare <= 0) throw new HttpError(409, 'El viaje no tiene una tarifa válida.');
  return trip;
}

// Escribe en el viaje SOLO si sigue en 'completed'. La transacción vuelve a
// leer el viaje justo antes de escribir: si otra petición ya lo dejó en 'paid'
// (doble toque, dos verify a la vez), no se toca. Devuelve el paymentStatus
// que quedó guardado. Dentro NO se llama a Mercado Pago: la transacción
// bloquea el documento mientras dura y puede repetirse.
async function updateIfCompleted(tripId, update) {
  const tripRef = db.collection('trips').doc(tripId);
  return db.runTransaction(async (transaction) => {
    const current = (await transaction.get(tripRef)).data();
    if (current?.status !== 'completed') return current?.paymentStatus ?? null;
    transaction.update(tripRef, update);
    return update.paymentStatus;
  });
}

// G3/G4: crear el cobro de un viaje finalizado.
async function startPayment(tripId, uid) {
  const trip = await getDriverTrip(tripId, uid);
  if (trip.status !== 'completed') throw new HttpError(409, 'El viaje no está listo para cobrar.');
  const { checkoutUrl } = await createPreference(trip);
  const saved = await updateIfCompleted(trip.id, { paymentStatus: PAYMENT_STATUS.PENDING });
  if (saved !== PAYMENT_STATUS.PENDING) throw new HttpError(409, 'El viaje ya fue cobrado.');
  return { checkoutUrl };
}

// G6: al volver del checkout, preguntar a Mercado Pago y actualizar el viaje.
async function verifyPayment(tripId, uid) {
  const trip = await getDriverTrip(tripId, uid);
  if (trip.status === 'paid') return { paymentStatus: trip.paymentStatus };
  if (trip.status !== 'completed') throw new HttpError(409, 'El viaje no está listo para cobrar.');

  // Mercado Pago se consulta FUERA de la transacción.
  const summary = summarizePayments(await findPaymentsForTrip(trip.id), trip.fare, CONFIG.currency);
  if (!summary) return { paymentStatus: trip.paymentStatus ?? PAYMENT_STATUS.PENDING };

  const update = { paymentStatus: summary.paymentStatus, paymentId: summary.paymentId };
  if (summary.paymentStatus === PAYMENT_STATUS.APPROVED) {
    update.status = 'paid';
    update.paidAt = FieldValue.serverTimestamp();
  }
  return { paymentStatus: await updateIfCompleted(trip.id, update) };
}

module.exports = { HttpError, startPayment, verifyPayment };
