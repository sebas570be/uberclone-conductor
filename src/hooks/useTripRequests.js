// src/hooks/useTripRequests.js
// Hook personalizado obligatorio del enunciado (§3): solicitudes entrantes.
// Mientras isActive sea true (Disponible, en Inicio y con ubicación), escucha
// en tiempo real las solicitudes "requested" de este conductor y devuelve la
// más antigua que todavía se puede responder (o null).
// - Una solicitud con datos inválidos o vencida (llegó con la app cerrada) se
//   rechaza sin mostrarla: si se quedara en "requested", el conductor
//   aparecería ocupado para siempre. Las reglas permiten rechazar siempre.
// - Cleanup: al dejar de estar activo o desmontar, se deja de escuchar.
// AI-assisted: see docs/AI_LOG.md #11
import { useEffect, useState } from 'react';
import useSession from './useSession';
import { TRIP_STATUS } from '../config/tripRequest';
import { subscribeToTripRequests, respondToTrip } from '../services/tripService';
import { parseTripRequest, getSecondsLeft } from '../utils/tripRequestData';

const rejectSilently = (tripId, reason) => {
  console.log(`Solicitud ${tripId} rechazada automáticamente (${reason}).`);
  respondToTrip(tripId, TRIP_STATUS.REJECTED).catch((error) =>
    console.log('No se pudo rechazar la solicitud:', error?.code)
  );
};

export default function useTripRequests(isActive) {
  const { user } = useSession();
  const uid = user?.uid;
  const [request, setRequest] = useState(null);

  useEffect(() => {
    if (!isActive || !uid) {
      setRequest(null);
      return undefined;
    }

    const unsubscribe = subscribeToTripRequests(
      uid,
      (documents) => {
        const now = Date.now();
        const pending = [];
        documents.forEach(({ id, data }) => {
          const trip = parseTripRequest(id, data);
          if (!trip) {
            rejectSilently(id, 'datos inválidos');
          } else if (getSecondsLeft(trip.createdAtMs, now) === 0) {
            rejectSilently(id, 'venció sin respuesta');
          } else {
            pending.push(trip);
          }
        });
        // La más antigua primero: es la que vence antes.
        pending.sort((a, b) => a.createdAtMs - b.createdAtMs);
        setRequest(pending[0] ?? null);
      },
      (error) => console.log('No se pudieron escuchar las solicitudes:', error?.code)
    );

    // CLEANUP: dejar de escuchar Firestore.
    return () => {
      unsubscribe();
    };
  }, [isActive, uid]);

  return request;
}
