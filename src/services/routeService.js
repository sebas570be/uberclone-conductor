// src/services/routeService.js
// Ruta en carro desde la posición del conductor hasta el punto de recogida.
// Se pide UNA vez al abrir el viaje; la ruta del viaje (origen → destino) ya
// viene guardada en el documento (routePolyline).
import { ROUTES } from '../config/routes';
import { decodePolyline } from '../utils/polyline';

// from / to: { latitude, longitude }.
// Devuelve { points, distanceKm, durationMin } o lanza un error.
export async function getDrivingRoute(from, to) {
  // OSRM recibe "longitud,latitud".
  const coordinates = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
  const url = `${ROUTES.osrmBaseUrl}/route/v1/driving/${coordinates}?overview=full&geometries=polyline`;

  // AbortController: si OSRM no responde a tiempo, se cancela la petición
  // (no se deja la pantalla esperando para siempre).
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ROUTES.requestTimeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`OSRM respondió ${response.status}`);
    const data = await response.json();

    // No se confía ciegamente en la API: se revisa antes de usar.
    const route = data?.routes?.[0];
    const points = decodePolyline(route?.geometry);
    const isValid =
      data?.code === 'Ok' &&
      Number.isFinite(route?.distance) &&
      Number.isFinite(route?.duration) &&
      points.length > 1;
    if (!isValid) throw new Error('OSRM no devolvió una ruta válida');

    return {
      points,
      distanceKm: Math.round(route.distance / 100) / 10,
      durationMin: Math.max(1, Math.ceil(route.duration / 60)),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
