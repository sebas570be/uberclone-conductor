// src/utils/earnings.js
// Funciones puras del historial y las ganancias: sin Firebase ni pantallas,
// así que se prueban con Jest.
// Fechas en la hora del celular. La semana va de lunes a domingo. Cada rango
// es [inicio, fin): incluye el inicio y NO el fin (el día siguiente a las 00:00).
import { PERIOD } from '../config/history';
import { TRIP_STATUS } from '../config/tripRequest';

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Sumar días con el constructor (y no con milisegundos) para que un cambio de
// hora no corra el día.
function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

// Hoy, esta semana (desde el lunes) o este mes, según la fecha `now`.
export function getPeriodRange(period, now = new Date()) {
  const today = startOfDay(now);
  if (period === PERIOD.TODAY) return { start: today, end: addDays(today, 1) };
  if (period === PERIOD.WEEK) {
    // getDay(): domingo = 0, lunes = 1... → días que pasaron desde el lunes.
    const daysSinceMonday = (today.getDay() + 6) % 7;
    const monday = addDays(today, -daysSinceMonday);
    return { start: monday, end: addDays(monday, 7) };
  }
  if (period === PERIOD.MONTH) {
    return {
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: new Date(today.getFullYear(), today.getMonth() + 1, 1),
    };
  }
  return null;
}

// Rango elegido con "Desde" y "Hasta" (incluye los dos días completos).
// null si falta una fecha o "Desde" es posterior a "Hasta".
export function getCustomRange(from, to) {
  if (!(from instanceof Date) || !(to instanceof Date)) return null;
  const start = startOfDay(from);
  const end = addDays(startOfDay(to), 1);
  return start < end ? { start, end } : null;
}

// Viajes del rango (o todos si range es null) y del método de pago elegido
// ('all' = todos), del más reciente al más antiguo (HI1, HI2).
export function filterTrips(trips, { range = null, paymentMethod = 'all' } = {}) {
  return trips
    .filter((trip) => {
      if (paymentMethod !== 'all' && trip.paymentMethod !== paymentMethod) return false;
      if (!range) return true;
      return trip.completedAtMs >= range.start.getTime() && trip.completedAtMs < range.end.getTime();
    })
    .sort((a, b) => b.completedAtMs - a.completedAtMs);
}

// Totales de Ganancias (T8). Solo cuentan los viajes PAGADOS (dinero real);
// los que siguen sin pagar van aparte en `pending` y no se mezclan.
export function summarizeEarnings(trips) {
  const paid = trips.filter((trip) => trip.status === TRIP_STATUS.PAID);
  const unpaid = trips.filter((trip) => trip.status === TRIP_STATUS.COMPLETED);
  const sum = (list, field) => list.reduce((total, trip) => total + (trip[field] ?? 0), 0);

  const netEarnings = sum(paid, 'driverEarnings');
  return {
    tripCount: paid.length,
    totalFare: sum(paid, 'fare'),
    totalCommission: sum(paid, 'commission'),
    totalTips: sum(paid, 'tip'),
    netEarnings,
    averagePerTrip: paid.length > 0 ? Math.round(netEarnings / paid.length) : 0,
    pending: { tripCount: unpaid.length, amount: sum(unpaid, 'fare') },
  };
}

// Saldo con la plataforma (T9): lo que la plataforma le debe al conductor por
// los viajes pagados con Mercado Pago, menos las comisiones que el conductor
// le debe por los viajes que cobró en efectivo. Puede quedar negativo (G11).
export function calculateBalance(trips) {
  return trips
    .filter((trip) => trip.status === TRIP_STATUS.PAID)
    .reduce((balance, trip) => {
      if (trip.paymentMethod === 'cash') return balance - trip.commission;
      return balance + trip.driverEarnings;
    }, 0);
}
