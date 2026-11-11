// backend/src/services/routeService.js
// Ruta en carro entre dos puntos con OSRM (servidor público, sin llave).
// Se llama UNA sola vez por solicitud, nunca en cada movimiento (enunciado §7).
// AI-assisted: see docs/AI_LOG.md #10
const { CONFIG } = require('../config');
const { fetchJson } = require('./httpClient');
const { isValidPoint } = require('../utils/tripRequest');

async function getDrivingRoute(origin, destination) {
  // OSRM recibe "longitud,latitud" (al revés de como se escribe normalmente).
  const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  // overview=full + geometries=polyline → la ruta completa como texto codificado
  // (routePolyline), para dibujarla después con <Polyline> en el mapa.
  const url = `${CONFIG.osrmBaseUrl}/route/v1/driving/${coordinates}?overview=full&geometries=polyline`;

  // fetchJson reintenta una vez los fallos pasajeros. Si aun así falla, el error
  // sube y NO se crea la solicitud: sin ruta no hay distancia ni tarifa.
  const data = await fetchJson(url, { label: 'OSRM' });

  // No se confía ciegamente en la API: se revisa cada dato antes de usarlo.
  const route = data?.routes?.[0];
  const [start, end] = (data?.waypoints ?? []).map((waypoint) => ({
    lng: waypoint?.location?.[0],
    lat: waypoint?.location?.[1],
  }));
  const isValid =
    data?.code === 'Ok' &&
    Number.isFinite(route?.distance) && route.distance > 0 &&
    Number.isFinite(route?.duration) && route.duration > 0 &&
    typeof route?.geometry === 'string' && route.geometry.length > 0 &&
    isValidPoint(start) && isValidPoint(end);
  if (!isValid) throw new Error('OSRM no devolvió una ruta válida entre los dos puntos.');

  return {
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    polyline: route.geometry,
    // Puntos "pegados" a la vía más cercana: el pasajero no queda dentro de
    // un edificio o en mitad de un parque.
    start,
    end,
  };
}

module.exports = { getDrivingRoute };
