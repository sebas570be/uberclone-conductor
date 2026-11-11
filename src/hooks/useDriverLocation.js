// src/hooks/useDriverLocation.js
// Hook personalizado obligatorio del enunciado (§3): ubicación del conductor.
// 1) Al montar: pide el permiso y obtiene la posición actual para el mapa.
// 2) Mientras isActive sea true (Disponible Y en la pantalla Inicio):
//    - sigue el GPS con watchPositionAsync (avisa cada 20 m);
//    - escribe en Firestore la última posición cada 5 s (setInterval), esté
//      quieto o moviéndose (en iOS timeInterval no funciona, por eso el intervalo).
// 3) Limpieza (cleanup del useEffect): al pasar a No disponible, salir de la
//    pantalla o cerrar sesión, apaga el GPS, detiene el envío y marca
//    "no disponible" con la ubicación en null.
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import useSession from './useSession';
import { auth } from '../config/firebase';
import { LOCATION } from '../config/location';
import { saveDriverLocation } from '../services/locationService';

// Estados del permiso/GPS que la pantalla muestra.
export const LOCATION_STATUS = Object.freeze({
  LOADING: 'loading', // pidiendo permiso o buscando la posición
  READY: 'ready', // hay posición
  DENIED: 'denied', // el conductor negó el permiso
  UNAVAILABLE: 'unavailable', // GPS apagado o sin señal
});

const pickCoords = (location) => ({
  latitude: location.coords.latitude,
  longitude: location.coords.longitude,
});

export default function useDriverLocation(isActive) {
  const { user } = useSession();
  const uid = user?.uid;
  const [position, setPosition] = useState(null);
  const [status, setStatus] = useState(LOCATION_STATUS.LOADING);
  const [attempt, setAttempt] = useState(0); // "Reintentar" vuelve a correr el efecto 1
  // useRef y no useState: el intervalo lee siempre la ÚLTIMA posición sin
  // tener que reiniciarse cada vez que el GPS avisa.
  const latestPositionRef = useRef(null);

  // Efecto 1: permiso + posición inicial.
  useEffect(() => {
    let isMounted = true;
    setStatus(LOCATION_STATUS.LOADING);

    (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!isMounted) return;
      if (!permission.granted) {
        setStatus(LOCATION_STATUS.DENIED);
        return;
      }
      try {
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!isMounted) return;
        const coords = pickCoords(current);
        latestPositionRef.current = coords;
        setPosition(coords);
        setStatus(LOCATION_STATUS.READY);
      } catch (error) {
        console.log('No se pudo obtener la ubicación:', error?.message);
        if (isMounted) setStatus(LOCATION_STATUS.UNAVAILABLE);
      }
    })();

    // Si la pantalla se desmonta antes de terminar, no se actualiza el estado.
    return () => {
      isMounted = false;
    };
  }, [attempt]);

  // Efecto 2: seguir el GPS y enviar la ubicación mientras esté activo.
  useEffect(() => {
    if (!isActive || status !== LOCATION_STATUS.READY || !uid) return undefined;

    let subscription = null;
    let isCancelled = false;

    // watchPositionAsync es asíncrono: si la limpieza corre ANTES de que
    // termine, la suscripción que llega tarde se cierra de inmediato.
    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: LOCATION.distanceIntervalMeters,
        timeInterval: LOCATION.sendIntervalMs, // solo Android
      },
      (location) => {
        // Puede llegar un aviso del GPS justo después de la limpieza: se ignora.
        if (isCancelled) return;
        const coords = pickCoords(location);
        latestPositionRef.current = coords;
        setPosition(coords);
      }
    )
      .then((newSubscription) => {
        if (isCancelled) newSubscription.remove();
        else subscription = newSubscription;
      })
      .catch((error) => console.log('No se pudo seguir el GPS:', error?.message));

    const send = () => {
      if (!latestPositionRef.current) return;
      saveDriverLocation(uid, true, latestPositionRef.current).catch((error) =>
        console.log('No se pudo enviar la ubicación:', error?.code)
      );
    };
    send(); // la primera, sin esperar 5 s
    const intervalId = setInterval(send, LOCATION.sendIntervalMs);

    // CLEANUP (lo exige el enunciado): apagar GPS, detener envío y marcar
    // "no disponible" sin ubicación. Si ya no hay sesión, no se intenta: las
    // reglas la rechazarían. Al cerrar sesión desde el menú, el "no disponible"
    // se escribe ANTES del signOut (MainDrawer); si la app se cierra de golpe,
    // la ubicación vieja se detecta por updatedAt (más de 30 s).
    return () => {
      isCancelled = true;
      subscription?.remove();
      clearInterval(intervalId);
      if (auth.currentUser) {
        saveDriverLocation(uid, false, null).catch(() => {});
      }
    };
  }, [isActive, status, uid]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return { position, status, retry };
}
