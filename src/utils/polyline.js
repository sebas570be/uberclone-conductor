// src/utils/polyline.js
// Convierte una ruta codificada (formato "polyline" de Google, el que entrega
// OSRM con geometries=polyline) en la lista de puntos que dibuja <Polyline>.
// Función pura: sin librerías, se prueba con Jest.

// Cada número viene en bloques de 5 bits (+63 para que sea un carácter
// imprimible). El bit 0x20 dice si sigue otro bloque. El resultado es la
// DIFERENCIA con el punto anterior, multiplicada por 100000 (5 decimales).
function readValue(encoded, startIndex) {
  let result = 0;
  let shift = 0;
  let index = startIndex;
  let chunk;
  do {
    if (index >= encoded.length) throw new Error('Polyline incompleta');
    chunk = encoded.charCodeAt(index) - 63;
    index += 1;
    result |= (chunk & 0x1f) << shift;
    shift += 5;
  } while (chunk >= 0x20);
  // El último bit indica el signo.
  const value = result & 1 ? ~(result >> 1) : result >> 1;
  return { value, nextIndex: index };
}

// "_p~iF~ps|U_ulLnnqC" → [{ latitude: 38.5, longitude: -120.2 }, ...]
// Devuelve [] si el texto está vacío o mal formado (no rompe el mapa).
export function decodePolyline(encoded) {
  if (typeof encoded !== 'string' || encoded.length === 0) return [];
  const points = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;
  try {
    while (index < encoded.length) {
      const lat = readValue(encoded, index);
      const lng = readValue(encoded, lat.nextIndex);
      index = lng.nextIndex;
      latitude += lat.value;
      longitude += lng.value;
      points.push({ latitude: latitude / 1e5, longitude: longitude / 1e5 });
    }
  } catch {
    return [];
  }
  return points;
}
