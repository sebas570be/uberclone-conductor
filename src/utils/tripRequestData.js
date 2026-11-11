// src/utils/tripRequestData.js
// Funciones puras de la solicitud de viaje: sin Firebase ni temporizadores,
// así que se prueban con Jest.
// AI-assisted: see docs/AI_LOG.md #11
import { PRICING } from '../config/pricing';
import { TRIP_REQUEST, TRIP_STATUS } from '../config/tripRequest';

const PAYMENT_METHOD_LABELS = Object.freeze({
  mercadopago: 'Mercado Pago',
  stripe: 'Stripe',
  cash: 'Efectivo',
});

const isPositiveNumber = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0;

const isValidPlace = (place) =>
  typeof place?.address === 'string' &&
  place.address.trim().length > 0 &&
  Number.isFinite(place.lat) &&
  Number.isFinite(place.lng);

// hasOwnProperty y no "in": así 'constructor' o 'toString' no cuentan como categoría.
const isKnownCategory = (category) =>
  typeof category === 'string' && Object.prototype.hasOwnProperty.call(PRICING.categoryMultipliers, category);

// Convierte un documento de trips en el objeto que usa la pantalla, o devuelve
// null si algo no cuadra. Los datos que llegan de la base de datos NO se usan
// sin revisarlos: una solicitud mal formada se descarta en vez de romper la app.
// createdAt llega como Timestamp de Firestore; se guarda en milisegundos
// (número) para poder pasarlo como parámetro de navegación.
export function parseTripRequest(id, data) {
  const createdAt = data?.createdAt?.toDate?.();
  const isValid =
    typeof id === 'string' &&
    data?.status === TRIP_STATUS.REQUESTED &&
    createdAt instanceof Date &&
    !Number.isNaN(createdAt.getTime()) &&
    isKnownCategory(data.category) &&
    Object.prototype.hasOwnProperty.call(PAYMENT_METHOD_LABELS, data.paymentMethod) &&
    isPositiveNumber(data.distanceKm) &&
    isPositiveNumber(data.durationMin) &&
    isValidPlace(data.origin) &&
    isValidPlace(data.destination);
  if (!isValid) return null;

  return {
    id,
    category: data.category,
    paymentMethod: data.paymentMethod,
    distanceKm: data.distanceKm,
    durationMin: data.durationMin,
    origin: { address: data.origin.address, lat: data.origin.lat, lng: data.origin.lng },
    destination: { address: data.destination.address, lat: data.destination.lat, lng: data.destination.lng },
    createdAtMs: createdAt.getTime(),
  };
}

// Segundos que le quedan al conductor, contados desde createdAt (la misma
// referencia que usan las reglas). Nunca menos de 0 ni más del límite (si el
// reloj del celular va un poco atrasado, no se muestran 17 s).
// Math.ceil: con 0,3 s restantes se muestra 1, no 0.
export function getSecondsLeft(createdAtMs, nowMs, timeoutSec = TRIP_REQUEST.responseTimeoutSec) {
  const remainingMs = createdAtMs + timeoutSec * 1000 - nowMs;
  return Math.min(timeoutSec, Math.max(0, Math.ceil(remainingMs / 1000)));
}

// Pesos colombianos con punto de miles: 19200 → "$ 19.200".
// Expresión regular y no toLocaleString: da lo mismo en cualquier celular.
export function formatCop(value) {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  const digits = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}$ ${digits}`;
}

// Texto que ve el conductor para el método de pago ('cash' → 'Efectivo').
export function paymentMethodLabel(paymentMethod) {
  return PAYMENT_METHOD_LABELS[paymentMethod] ?? '';
}
