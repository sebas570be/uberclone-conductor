// src/hooks/useFinishedTrips.js
// Viajes terminados del conductor (finalizados sin pagar y pagados), en tiempo
// real. Los usan Ganancias e Historial. Cada viaje se revisa con
// parseFinishedTrip: uno con datos inválidos se descarta en vez de romper la
// pantalla. Firestore comparte la misma escucha si dos pantallas hacen la
// misma consulta.
import { useEffect, useState } from 'react';
import useSession from './useSession';
import { subscribeToFinishedTrips } from '../services/tripService';
import { parseFinishedTrip } from '../utils/tripRequestData';

export default function useFinishedTrips() {
  const { user } = useSession();
  const uid = user?.uid;
  const [trips, setTrips] = useState([]);
  // Empieza en true: hasta la primera respuesta no se sabe qué viajes hay.
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!uid) {
      setTrips([]);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToFinishedTrips(
      uid,
      (documents) => {
        setTrips(documents.map(({ id, data }) => parseFinishedTrip(id, data)).filter(Boolean));
        setHasError(false);
        setIsLoading(false);
      },
      (error) => {
        console.log('No se pudieron escuchar los viajes terminados:', error?.code);
        setHasError(true);
        setIsLoading(false);
      }
    );

    // CLEANUP: dejar de escuchar al cerrar sesión o desmontar.
    return () => {
      unsubscribe();
    };
  }, [uid]);

  return { trips, isLoading, hasError };
}
