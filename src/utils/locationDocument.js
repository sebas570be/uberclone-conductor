// src/utils/locationDocument.js
// Funciones puras de la ubicación del conductor (driverLocations/{uid}).
// Sin Firebase ni GPS: se prueban con Jest.
import { LOCATION } from '../config/location';

// Documento que se guarda. Si NO está disponible, la ubicación se guarda en
// null: no queda registrado dónde está un conductor que no está trabajando
// (privacidad / mínimo privilegio). Las reglas de Firestore también lo exigen.
export function buildLocationDocument(isAvailable, coords) {
  if (!isAvailable || !coords) {
    return { isAvailable: Boolean(isAvailable && coords), location: null };
  }
  return {
    isAvailable: true,
    location: { latitude: coords.latitude, longitude: coords.longitude },
  };
}

// ¿La ubicación está vieja? (la usarán las solicitudes para ignorar conductores
// que dejaron de enviar, por ejemplo porque cerraron sesión estando Disponible).
export function isLocationStale(updatedAt, now = new Date()) {
  if (!(updatedAt instanceof Date) || Number.isNaN(updatedAt.getTime())) return true;
  return now.getTime() - updatedAt.getTime() > LOCATION.staleAfterMs;
}
