// backend/src/utils/payment.js
// Funciones puras de pagos: sin Firebase ni internet, se prueban con node:test.

// Estados que guarda el viaje en paymentStatus (enunciado S4: Aprobado,
// Pendiente, Rechazado, Efectivo).
const PAYMENT_STATUS = Object.freeze({
  APPROVED: 'approved',
  PENDING: 'pending',
  REJECTED: 'rejected',
  CASH: 'cash',
});

// Estados de Mercado Pago que todavía pueden terminar aprobados.
const MP_PENDING_STATUSES = Object.freeze(['pending', 'in_process', 'authorized']);

// De la lista de pagos que Mercado Pago tiene para un viaje, decide el estado
// del viaje: si alguno está aprobado POR EL MONTO CORRECTO → aprobado; si
// alguno sigue en proceso → pendiente; si todos fallaron → rechazado; si no
// hay ninguno → null (el pasajero todavía no paga).
// Se revisa el monto y la moneda: no se confía en que el pago sea del valor
// correcto solo porque tiene el id del viaje.
function summarizePayments(payments, expectedAmount, currency) {
  if (!Array.isArray(payments) || payments.length === 0) return null;

  const approved = payments.find(
    (payment) =>
      payment?.status === 'approved' &&
      payment.transaction_amount === expectedAmount &&
      payment.currency_id === currency
  );
  if (approved) return { paymentStatus: PAYMENT_STATUS.APPROVED, paymentId: String(approved.id) };

  const pending = payments.find((payment) => MP_PENDING_STATUSES.includes(payment?.status));
  if (pending) return { paymentStatus: PAYMENT_STATUS.PENDING, paymentId: String(pending.id) };

  // El más reciente primero (la búsqueda se pide ordenada por fecha).
  return { paymentStatus: PAYMENT_STATUS.REJECTED, paymentId: String(payments[0]?.id ?? '') };
}

// Enlace del checkout. La documentación de Mercado Pago indica usar init_point
// también para probar (con las cuentas de prueba); sandbox_init_point está
// marcado como "no usar".
function pickCheckoutUrl(preference) {
  const url = preference?.init_point;
  if (typeof url !== 'string' || !url.startsWith('https://')) {
    throw new Error('Mercado Pago no devolvió un enlace de pago válido.');
  }
  return url;
}

module.exports = { PAYMENT_STATUS, summarizePayments, pickCheckoutUrl };
