// backend/src/utils/tripRequest.js
// Funciones puras de la solicitud simulada: no tocan Firebase ni internet,
// así que se pueden probar solas (igual que driverDocument.js en la app).
// AI-assisted: see docs/AI_LOG.md #10

const METERS_PER_DEGREE = 111320; // metros que mide 1 grado de latitud (aprox.)

const round6 = (value) => Math.round(value * 1e6) / 1e6; // 6 decimales ≈ 11 cm

// Punto a una distancia aleatoria (entre min y max metros, en línea recta)
// de "center", en cualquier dirección. random se puede reemplazar en pruebas.
function randomPointNear(center, minMeters, maxMeters, random = Math.random) {
  const distance = minMeters + (maxMeters - minMeters) * random();
  const angle = 2 * Math.PI * random();
  const deltaLat = (distance * Math.cos(angle)) / METERS_PER_DEGREE;
  // Un grado de longitud mide menos lejos del ecuador: se corrige con cos(latitud).
  const deltaLng = (distance * Math.sin(angle)) / (METERS_PER_DEGREE * Math.cos((center.lat * Math.PI) / 180));
  return { lat: round6(center.lat + deltaLat), lng: round6(center.lng + deltaLng) };
}

// ¿Es un punto válido? Los datos que vienen de afuera (Firestore, APIs) no se
// usan sin revisarlos.
function isValidPoint(point) {
  return (
    Number.isFinite(point?.lat) && Number.isFinite(point?.lng) &&
    Math.abs(point.lat) <= 90 && Math.abs(point.lng) <= 180
  );
}

// ¿La ubicación del conductor es reciente? (misma idea que isLocationStale en la app).
function isFreshLocation(updatedAt, now, staleAfterMs) {
  if (!(updatedAt instanceof Date) || Number.isNaN(updatedAt.getTime())) return false;
  return now.getTime() - updatedAt.getTime() <= staleAfterMs;
}

// Método de pago: el que se pidió al ejecutar el script, o uno al azar.
function pickPaymentMethod(requested, methods, random = Math.random) {
  if (requested === undefined) return methods[Math.floor(random() * methods.length)];
  if (!methods.includes(requested)) {
    throw new Error(`Método de pago inválido: "${requested}". Usa uno de: ${methods.join(', ')}.`);
  }
  return requested;
}

// OSRM entrega metros y segundos; el viaje guarda km (1 decimal) y minutos.
// Math.ceil: un viaje de 12,1 min se cobra como 13 (nunca se cobra de menos).
function toTripMetrics(distanceMeters, durationSeconds) {
  const distanceKm = Math.round(distanceMeters / 100) / 10;
  if (!(distanceKm > 0)) {
    throw new Error('La ruta tiene distancia 0 km: no se crea la solicitud.');
  }
  const durationMin = Math.max(1, Math.ceil(durationSeconds / 60));
  return { distanceKm, durationMin };
}

// Dirección legible a partir de la respuesta de Nominatim, de lo más preciso a
// lo más general: "Lugar, Calle 45 # 7-10, Barrio, Ciudad".
//  1. Si hay calle o nombre de lugar (parque, centro comercial...), se arma con
//     las partes que existan, sin repetir (a veces el nombre ES la calle).
//  2. Si no hay ninguno de los dos (solo barrio o ciudad), se usan las 3
//     primeras partes de display_name, el nombre completo que trae Nominatim.
//  3. Si Nominatim no dio nada, se usan las coordenadas.
function formatAddress(nominatimResult, point) {
  const address = nominatimResult?.address;
  if (address) {
    // A veces el "nombre del lugar" es la misma calle: en ese caso no se repite.
    const place = nominatimResult.name && nominatimResult.name !== address.road ? nominatimResult.name : undefined;
    const street = address.road && address.house_number
      ? `${address.road} # ${address.house_number}`
      : address.road;
    const area = address.neighbourhood || address.quarter || address.suburb || address.city_district;
    const city = address.city || address.town || address.village || address.municipality;

    if (place || street) {
      const parts = [place, street, area, city].filter(Boolean);
      // Sin repetir (ej. barrio y ciudad con el mismo nombre).
      return parts.filter((part, index) => parts.indexOf(part) === index).join(', ');
    }

    const displayParts = (nominatimResult.display_name ?? '').split(',').map((part) => part.trim()).filter(Boolean);
    if (displayParts.length > 0) return displayParts.slice(0, 3).join(', ');

    const text = [area, city].filter(Boolean).join(', ');
    if (text) return text;
  }
  return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
}

// Documento trips/{id} en estado "requested", con los nombres en inglés del
// enunciado (§6). Tarifa, comisión, propina, pago y calificación NO van aquí:
// la app calcula la tarifa con calculateFare (la misma función al estimar y al
// cobrar) y el resto se llena al aceptar / finalizar el viaje.
// createdAt lo agrega el script con la hora del servidor.
function buildTripRequest({ driverId, passengerId, category, origin, destination, metrics, routePolyline, paymentMethod }) {
  return {
    driverId,
    passengerId,
    status: 'requested',
    category,
    origin: { lat: origin.lat, lng: origin.lng, address: origin.address },
    destination: { lat: destination.lat, lng: destination.lng, address: destination.address },
    distanceKm: metrics.distanceKm,
    durationMin: metrics.durationMin,
    routePolyline,
    paymentMethod,
  };
}

module.exports = {
  randomPointNear,
  isValidPoint,
  isFreshLocation,
  pickPaymentMethod,
  toTripMetrics,
  formatAddress,
  buildTripRequest,
};
