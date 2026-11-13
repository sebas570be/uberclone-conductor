// src/services/availabilityService.js
// Dejar al conductor "No disponible" en los dos lugares donde se guarda:
// - Firestore (driverLocations): para que no le lleguen solicitudes;
// - AsyncStorage (preferencia): para que Inicio no lo vuelva a poner
//   Disponible solo la próxima vez que entre.
// Se usa antes de que el conductor pierda el menú (al enviar cambios a
// revisión), cuando todavía tiene permiso de escribir su ubicación.
import { saveDriverLocation } from './locationService';
import { saveLastAvailability } from './preferencesService';

export async function goOffline(uid) {
  await saveDriverLocation(uid, false, null);
  await saveLastAvailability(uid, false);
}
