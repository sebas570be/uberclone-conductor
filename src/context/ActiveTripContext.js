// src/context/ActiveTripContext.js
// Context del viaje activo (enunciado H3: "useContext para la sesión del
// conductor y el viaje activo"). Escucha en tiempo real si el conductor tiene
// un viaje aceptado, yendo a recoger o en curso, y lo comparte con las
// pantallas. Si la app se cierra a mitad de un viaje, al abrirla el viaje
// sigue aquí y la app vuelve a la pantalla Viaje en curso.
// Solo se monta dentro del menú del conductor aprobado (MainDrawer).
import React, { createContext, useEffect, useMemo, useState } from 'react';
import useSession from '../hooks/useSession';
import { subscribeToActiveTrips } from '../services/tripService';
import { parseActiveTrip } from '../utils/tripRequestData';

export const ActiveTripContext = createContext(null);

export function ActiveTripProvider({ children }) {
  const { user } = useSession();
  const uid = user?.uid;
  const [activeTrip, setActiveTrip] = useState(null);
  // Empieza en true: hasta la primera respuesta no se sabe si hay viaje activo.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setActiveTrip(null);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToActiveTrips(
      uid,
      (documents) => {
        // Solo se usan los viajes con datos válidos. Si hubiera más de uno
        // (no debería), se toma el más antiguo.
        const trips = documents
          .map(({ id, data }) => parseActiveTrip(id, data))
          .filter(Boolean)
          .sort((a, b) => a.createdAtMs - b.createdAtMs);
        setActiveTrip(trips[0] ?? null);
        setIsLoading(false);
      },
      (error) => {
        console.log('No se pudo escuchar el viaje activo:', error?.code);
        setIsLoading(false);
      }
    );

    // CLEANUP: dejar de escuchar al cerrar sesión o desmontar.
    return () => {
      unsubscribe();
    };
  }, [uid]);

  // useMemo: las pantallas solo se vuelven a dibujar si cambia el viaje.
  const value = useMemo(() => ({ activeTrip, isLoading }), [activeTrip, isLoading]);

  return <ActiveTripContext.Provider value={value}>{children}</ActiveTripContext.Provider>;
}
