// src/config/routes.js
// Servicio de rutas de la app (OSRM: público, gratis y sin llave, el mismo
// que usa el backend). Solo se usa una vez por viaje: al ir a recoger
// (enunciado §7: "otra llamada al aceptar; nunca en cada movimiento").
export const ROUTES = Object.freeze({
  osrmBaseUrl: 'https://router.project-osrm.org',
  requestTimeoutMs: 10000,
});
