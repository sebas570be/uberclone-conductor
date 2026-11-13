// src/i18n/labels.js
// Texto en el idioma actual para los CÓDIGOS que se guardan en Firestore
// (género, categoría, color, método y estado del pago), para los "tipos" de
// error del cobro y para los mensajes de validación. Los datos guardan códigos
// ('gray', 'cash'); la pantalla decide el idioma con t.
// AI-assisted: see docs/AI_LOG.md #18, #19 y #20
import { TRIP_STATUS } from '../config/tripRequest';

// optionLabel(t, 'color', 'gray') → 'Gris' / 'Gray'. '' si no hay valor.
export const optionLabel = (t, group, value) => (value ? t(`options.${group}.${value}`) : '');

// Opciones de una lista desplegable con el texto en el idioma actual (el valor
// guardado sigue siendo el código).
export const translatedOptions = (t, options, group) =>
  options.map((option) => ({ value: option.value, label: optionLabel(t, group, option.value) }));

export const paymentMethodText = (t, paymentMethod) => (paymentMethod ? t(`paymentMethod.${paymentMethod}`) : '');

// Estado del cobro (S4). Sin estado todavía: "Pendiente".
export const paymentStatusText = (t, paymentStatus) => t(`paymentStatus.${paymentStatus ?? 'pending'}`);

// Historial (HI3): los finalizados sin pagar dicen "Pendiente de pago";
// los pagados, cómo se pagó.
export const historyStatusText = (t, trip) =>
  trip.status === TRIP_STATUS.COMPLETED ? t('paymentStatus.unpaid') : paymentStatusText(t, trip.paymentStatus);

// Clave del mensaje de error del cobro con Mercado Pago, según el "tipo" de
// PaymentError (src/utils/paymentRequest.js) o el código HTTP del backend.
const PAYMENT_ERROR_KEYS = Object.freeze({
  config: 'payment.config',
  session: 'payment.session',
  401: 'payment.session',
  network: 'payment.network',
  409: 'payment.alreadyPaid',
  502: 'payment.mercadoPagoDown',
});

export const paymentErrorKey = (error) => PAYMENT_ERROR_KEYS[error?.kind] ?? 'payment.generic';

// Después de "Verificar pago": aprobado no necesita mensaje (la pantalla
// cambia sola a "Viaje pagado"); rechazado o pendiente, sí. null = sin mensaje.
export function verifyMessageKey(paymentStatus) {
  if (paymentStatus === 'rejected') return 'payment.rejected';
  if (paymentStatus === 'pending') return 'payment.stillPending';
  return null;
}

// Mensaje de validación (src/utils/registrationErrors.js): { key, params } →
// texto. Un parámetro que también es { key } se traduce (por ejemplo, el nombre
// de la categoría). Un texto que ya viene traducido se deja igual.
export function errorText(t, error) {
  if (!error) return undefined;
  if (typeof error === 'string') return error;
  const params = Object.fromEntries(
    Object.entries(error.params ?? {}).map(([name, value]) => [name, value?.key ? t(value.key) : value])
  );
  return t(error.key, params);
}
