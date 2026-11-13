// src/utils/tripRequestData.js
// Funciones puras de la solicitud de viaje: sin Firebase ni temporizadores,
// así que se prueban con Jest.
// AI-assisted: see docs/AI_LOG.md #11
import { PRICING } from '../config/pricing';
import { TRIP_REQUEST, TRIP_STATUS, ACTIVE_TRIP_STATUSES, PAYMENT_STATUS } from '../config/tripRequest';

// Códigos válidos que llegan de Firestore. El texto que ve el conductor lo pone
// la pantalla en su idioma (paymentMethodText y paymentStatusText en
// src/i18n/labels.js).
const PAYMENT_METHODS = Object.freeze(['mercadopago', 'stripe', 'cash']);
const PAYMENT_STATUSES = Object.freeze(Object.values(PAYMENT_STATUS));

const isPositiveNumber = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0;

const isValidPlace = (place) =>
  typeof place?.address === 'string' &&
  place.address.trim().length > 0 &&
  Number.isFinite(place.lat) &&
  Number.isFinite(place.lng);

// hasOwnProperty y no "in": así 'constructor' o 'toString' no cuentan como categoría.
const isKnownCategory = (category) =>
  typeof category === 'string' && Object.prototype.hasOwnProperty.call(PRICING.categoryMultipliers, category);

// Revisión común a cualquier viaje: devuelve el objeto que usan las pantallas
// o null si algo no cuadra. Los datos que llegan de la base de datos NO se usan
// sin revisarlos: un viaje mal formado se descarta en vez de romper la app.
// createdAt llega como Timestamp de Firestore; se guarda en milisegundos
// (número) para poder pasarlo como parámetro de navegación.
function parseTripBase(id, data) {
  const createdAt = data?.createdAt?.toDate?.();
  const isValid =
    typeof id === 'string' &&
    createdAt instanceof Date &&
    !Number.isNaN(createdAt.getTime()) &&
    isKnownCategory(data.category) &&
    PAYMENT_METHODS.includes(data.paymentMethod) &&
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

// Solicitud entrante: solo si está en "requested".
export function parseTripRequest(id, data) {
  if (data?.status !== TRIP_STATUS.REQUESTED) return null;
  return parseTripBase(id, data);
}

// Viaje activo (aceptado, yendo a recoger o en curso). Además de lo común
// necesita la ruta del viaje (routePolyline) para dibujarla en el mapa.
export function parseActiveTrip(id, data) {
  if (!ACTIVE_TRIP_STATUSES.includes(data?.status)) return null;
  if (typeof data.routePolyline !== 'string' || data.routePolyline.length === 0) return null;
  const base = parseTripBase(id, data);
  if (!base) return null;
  return { ...base, status: data.status, routePolyline: data.routePolyline };
}

// Viaje terminado, para la pantalla de cobro y resumen (S4): finalizado (por
// cobrar) o ya pagado. Además de lo común necesita el cobro que guardó
// "Finalizar": tarifa, comisión y ganancia en pesos enteros y coherentes.
// Un paymentStatus desconocido se trata como "todavía sin estado" (null).
export function parseTripSummary(id, data) {
  if (data?.status !== TRIP_STATUS.COMPLETED && data?.status !== TRIP_STATUS.PAID) return null;
  const { fare, commission, driverEarnings, commissionRate } = data;
  const isValidCharge =
    Number.isInteger(fare) &&
    fare > 0 &&
    Number.isInteger(commission) &&
    commission >= 0 &&
    driverEarnings === fare - commission;
  if (!isValidCharge) return null;
  const base = parseTripBase(id, data);
  if (!base) return null;

  return {
    ...base,
    status: data.status,
    fare,
    commission,
    driverEarnings,
    commissionRate: typeof commissionRate === 'number' && commissionRate >= 0 && commissionRate <= 1 ? commissionRate : null,
    paymentStatus: PAYMENT_STATUSES.includes(data.paymentStatus) ? data.paymentStatus : null,
  };
}

// Viaje terminado para el historial y las ganancias (S5, S6): lo mismo que el
// resumen más la hora en que terminó (en milisegundos, para filtrar por fecha),
// la propina y la ruta para dibujarla en el detalle. Sin completedAt no se
// puede ubicar en el historial: se descarta.
export function parseFinishedTrip(id, data) {
  const summary = parseTripSummary(id, data);
  const completedAt = data?.completedAt?.toDate?.();
  if (!summary || !(completedAt instanceof Date) || Number.isNaN(completedAt.getTime())) return null;
  return {
    ...summary,
    completedAtMs: completedAt.getTime(),
    tip: Number.isInteger(data.tip) && data.tip >= 0 ? data.tip : 0,
    routePolyline: typeof data.routePolyline === 'string' ? data.routePolyline : '',
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
