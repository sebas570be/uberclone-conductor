// src/services/tripService.js
// Único lugar de la app que lee y escribe viajes (trips) en Firestore.
// Los viajes los CREA el backend; la app solo escucha los suyos y responde.
// AI-assisted: see docs/AI_LOG.md #11
import { collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { TRIP_STATUS, ACTIVE_TRIP_STATUSES } from '../config/tripRequest';
import { buildCompletionData } from '../utils/tripCompletion';

// Escucha en tiempo real las solicitudes "requested" de este conductor.
// La consulta DEBE filtrar por driverId: las reglas solo dejan leer los viajes
// propios, y Firestore rechaza una consulta que pueda traer viajes de otros.
// Devuelve la función para dejar de escuchar (se usa en el cleanup del hook).
export function subscribeToTripRequests(uid, onRequests, onError) {
  const requestsQuery = query(
    collection(db, 'trips'),
    where('driverId', '==', uid),
    where('status', '==', TRIP_STATUS.REQUESTED)
  );
  return onSnapshot(
    requestsQuery,
    (snapshot) => onRequests(snapshot.docs.map((tripDoc) => ({ id: tripDoc.id, data: tripDoc.data() }))),
    onError
  );
}

// Escucha en tiempo real el viaje activo de este conductor (aceptado, yendo a
// recoger o en curso). Igual que arriba, la consulta filtra por driverId.
export function subscribeToActiveTrips(uid, onTrips, onError) {
  const activeQuery = query(
    collection(db, 'trips'),
    where('driverId', '==', uid),
    where('status', 'in', ACTIVE_TRIP_STATUSES)
  );
  return onSnapshot(
    activeQuery,
    (snapshot) => onTrips(snapshot.docs.map((tripDoc) => ({ id: tripDoc.id, data: tripDoc.data() }))),
    onError
  );
}

// Aceptar o rechazar. Solo se envían status y respondedAt (las reglas no
// permiten cambiar nada más), con la hora del servidor.
export async function respondToTrip(tripId, status) {
  await updateDoc(doc(db, 'trips', tripId), {
    status,
    respondedAt: serverTimestamp(),
  });
}

// Avanzar el viaje un paso: "va a recoger" (driver_arriving) o "pasajero a
// bordo" (in_progress). Las reglas solo dejan cambiar el status en estos pasos.
export async function updateTripStatus(tripId, status) {
  await updateDoc(doc(db, 'trips', tripId), { status });
}

// Cancelar (solo antes de que el pasajero suba; las reglas lo verifican).
export async function cancelTrip(tripId) {
  await updateDoc(doc(db, 'trips', tripId), {
    status: TRIP_STATUS.CANCELLED,
    cancelledAt: serverTimestamp(),
  });
}

// Finalizar: tarifa final con calculateFare (buildCompletionData) y la hora
// del servidor. Las reglas recalculan la tarifa y rechazan otro valor.
export async function completeTrip(trip) {
  await updateDoc(doc(db, 'trips', trip.id), {
    ...buildCompletionData(trip),
    completedAt: serverTimestamp(),
  });
}

// Mensaje para el conductor según el error.
// permission-denied aquí significa que las reglas negaron la respuesta: la
// solicitud venció (más de 20 s) o ya no está en "requested".
export function getTripErrorMessage(error) {
  if (error?.code === 'permission-denied') {
    return 'La solicitud ya venció o ya no está disponible.';
  }
  return 'No se pudo enviar tu respuesta. Revisa tu conexión e inténtalo de nuevo.';
}
