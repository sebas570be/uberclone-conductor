// src/utils/dates.js
// Funciones puras de fechas para mostrar en pantalla.

// 6/11/2026 → "06/11/2026" (día/mes/año, como se escribe en Colombia).
export function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth va de 0 a 11
  return `${day}/${month}/${date.getFullYear()}`;
}

// La misma fecha de hoy, pero "years" años atrás (ej. para abrir el selector
// de nacimiento cerca de una fecha válida y no en el día de hoy).
export function yearsAgo(years, today = new Date()) {
  return new Date(today.getFullYear() - years, today.getMonth(), today.getDate());
}

// Fecha y hora de un viaje en el historial: "12/11/2026 19:05" (24 horas).
export function formatDateTime(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${formatDate(date)} ${hours}:${minutes}`;
}
