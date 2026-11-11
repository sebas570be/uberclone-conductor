// src/config/tripRequest.js
// Valores de las solicitudes de viaje en un solo lugar (como location.js).
// AI-assisted: see docs/AI_LOG.md #11
export const TRIP_REQUEST = Object.freeze({
  // Segundos para aceptar o rechazar (enunciado S2). Se cuentan desde createdAt
  // (hora del servidor): las reglas de Firestore aceptan hasta 15 s + 5 s de margen.
  responseTimeoutSec: 15,
});

// Estados del viaje que usa esta etapa (enunciado E1/E2). Los demás
// (driver_arriving, in_progress...) se agregan en la rama del viaje.
export const TRIP_STATUS = Object.freeze({
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
});
