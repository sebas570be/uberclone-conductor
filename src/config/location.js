// src/config/location.js
// Valores de la ubicación en tiempo real en un solo archivo (como pricing.js).
export const LOCATION = Object.freeze({
  // Cada cuánto se escribe la ubicación en Firestore mientras está Disponible.
  // Firestore gratis: 20.000 escrituras/día → 12 por minuto ≈ 27 horas de conexión.
  sendIntervalMs: 5000,
  // El GPS avisa al moverse esta distancia (ahorra batería). En iOS es la única
  // opción que se respeta: timeInterval de expo-location solo funciona en Android.
  distanceIntervalMeters: 20,
  // Si la última actualización tiene más de esto, se considera desconectado
  // (por ejemplo, si cerró sesión sin alcanzar a marcar "No disponible").
  staleAfterMs: 30000,
});
