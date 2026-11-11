// backend/src/services/geocodingService.js
// Coordenadas → dirección legible con Nominatim (OpenStreetMap, sin llave).
// Datos © colaboradores de OpenStreetMap (atribución en backend/README.md).
// AI-assisted: see docs/AI_LOG.md #10
const { CONFIG } = require('../config');
const { fetchJson } = require('./httpClient');
const { formatAddress } = require('../utils/tripRequest');

// fetchJson ya reintenta una vez los fallos pasajeros. Si aun así falla, la
// solicitud igual se crea con las coordenadas como dirección: la dirección es
// para leerla, no es indispensable para el viaje (a diferencia de la ruta).
async function reverseGeocode(point) {
  const url =
    `${CONFIG.nominatimBaseUrl}/reverse?format=jsonv2&zoom=18&accept-language=es` +
    `&lat=${point.lat}&lon=${point.lng}`;
  try {
    return formatAddress(await fetchJson(url, { label: 'Nominatim' }), point);
  } catch (error) {
    console.warn(`${error.message}; se usan las coordenadas como dirección.`);
    return formatAddress(null, point);
  }
}

module.exports = { reverseGeocode };
