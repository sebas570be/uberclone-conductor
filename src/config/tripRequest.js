// src/config/tripRequest.js
// Valores de las solicitudes de viaje en un solo lugar (como location.js).
// AI-assisted: see docs/AI_LOG.md #11
export const TRIP_REQUEST = Object.freeze({
  // Segundos para aceptar o rechazar (enunciado S2). Se cuentan desde createdAt
  // (hora del servidor): las reglas de Firestore aceptan hasta 15 s + 5 s de margen.
  responseTimeoutSec: 15,
});

// Estados del viaje (enunciado E1/E2). "paid" = ya cobrado (en efectivo o
// por Mercado Pago).
export const TRIP_STATUS = Object.freeze({
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  DRIVER_ARRIVING: 'driver_arriving',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  PAID: 'paid',
});

// Estado del cobro que se guarda en el viaje (paymentStatus, enunciado S4).
// Lo escribe el botón "Recibí el efectivo" o el backend (Mercado Pago).
export const PAYMENT_STATUS = Object.freeze({
  APPROVED: 'approved',
  PENDING: 'pending',
  REJECTED: 'rejected',
  CASH: 'cash',
});

// Un viaje en alguno de estos estados es el "viaje activo" del conductor:
// mientras exista, la app muestra la pantalla Viaje en curso.
export const ACTIVE_TRIP_STATUSES = Object.freeze([
  TRIP_STATUS.ACCEPTED,
  TRIP_STATUS.DRIVER_ARRIVING,
  TRIP_STATUS.IN_PROGRESS,
]);

// Viajes terminados: los que aparecen en el Historial y cuentan para Ganancias
// (finalizados sin pagar y pagados). Cancelados y rechazados no mueven dinero.
export const FINISHED_TRIP_STATUSES = Object.freeze([TRIP_STATUS.COMPLETED, TRIP_STATUS.PAID]);
