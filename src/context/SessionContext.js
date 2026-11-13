// src/context/SessionContext.js
// Context de sesión: dice en qué situación está el conductor para que la
// navegación raíz (RootNavigator) decida qué pantallas mostrar.
// Escucha a Firebase en tiempo real:
//   1) onAuthStateChanged: ¿hay un usuario con sesión iniciada?
//   2) onSnapshot de drivers/{uid}: ¿ya envió su registro? ¿está aprobado?
// También entrega los datos del conductor (driver) para la pantalla Perfil:
// así no hace falta una segunda escucha del mismo documento.
// Si el estado cambia en la base de datos (por ejemplo, de "pending" a
// "approved" desde la consola), la app cambia de pantalla sola.
// AI-assisted: see docs/AI_LOG.md #6
import React, { createContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Estados posibles del conductor, en el orden en que avanza.
// Si Firestore solo tiene la respuesta de su caché ("no existe"), se espera
// este tiempo a que conteste el servidor antes de decir "Sin conexión".
const OFFLINE_WAIT_MS = 5000;

export const DRIVER_STATUS = Object.freeze({
  SIGNED_OUT: 'signedOut', // sin sesión
  UNREGISTERED: 'unregistered', // tiene cuenta, pero no ha enviado el registro
  PENDING: 'pending', // registro enviado, esperando aprobación
  APPROVED: 'approved', // aprobado: puede usar la app
});

// Traduce el documento del conductor a un estado de la navegación.
// Solo "approved" da acceso al menú: cualquier otro valor se trata como
// pendiente (ante un dato raro se niega el acceso en vez de darlo).
function statusFromSnapshot(snapshot) {
  if (!snapshot.exists()) {
    return DRIVER_STATUS.UNREGISTERED;
  }
  return snapshot.data().status === 'approved' ? DRIVER_STATUS.APPROVED : DRIVER_STATUS.PENDING;
}

export const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [driverStatus, setDriverStatus] = useState(DRIVER_STATUS.SIGNED_OUT);
  // Documento drivers/{uid} tal como está en Firestore (null si no existe).
  const [driver, setDriver] = useState(null);
  // Empieza en true: al abrir la app, Firebase tarda un momento en decir si
  // había una sesión guardada. Sin esto se vería el login por un instante.
  const [isLoading, setIsLoading] = useState(true);
  // Clave del texto del error (src/i18n): RootNavigator lo muestra traducido.
  const [error, setError] = useState(null);

  useEffect(() => {
    // Escucha del documento del conductor; se cambia cada vez que cambia el usuario.
    let unsubscribeDriver = null;
    // Temporizador del aviso "Sin conexión" (ver OFFLINE_WAIT_MS).
    let offlineTimer = null;
    const clearOfflineTimer = () => {
      if (offlineTimer) {
        clearTimeout(offlineTimer);
        offlineTimer = null;
      }
    };
    const stopDriverListener = () => {
      // Se cancela también el temporizador: si no, podría mostrar "Sin conexión"
      // después de cerrar sesión o de cambiar de usuario.
      clearOfflineTimer();
      if (unsubscribeDriver) {
        unsubscribeDriver();
        unsubscribeDriver = null;
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Cambió el usuario (inició o cerró sesión): se cierra la escucha anterior
      // para no seguir leyendo el documento de otra persona.
      stopDriverListener();
      setUser(firebaseUser);
      setDriver(null); // no mostrar los datos del usuario anterior
      setError(null);

      if (!firebaseUser) {
        setDriverStatus(DRIVER_STATUS.SIGNED_OUT);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      unsubscribeDriver = onSnapshot(
        doc(db, 'drivers', firebaseUser.uid),
        // includeMetadataChanges: sin esto, cuando el servidor solo confirma lo
        // que ya decía la caché ("no existe"), Firestore NO vuelve a llamar este
        // callback y la app se quedaba en "Sin conexión" aunque hubiera internet.
        { includeMetadataChanges: true },
        (snapshot) => {
          // "No existe" desde la caché local NO significa que no se haya registrado:
          // puede ser que el servidor todavía no contesta. Se sigue mostrando la
          // carga y solo si el servidor no responde en OFFLINE_WAIT_MS se avisa
          // "Sin conexión". Cuando vuelva internet llega la respuesta real y se
          // corrige sola (gracias a includeMetadataChanges).
          if (!snapshot.exists() && snapshot.metadata.fromCache) {
            if (!offlineTimer) {
              offlineTimer = setTimeout(() => {
                offlineTimer = null;
                setError('session.offline');
                setIsLoading(false);
              }, OFFLINE_WAIT_MS);
            }
            return;
          }
          // Llegó una respuesta válida: ya no hace falta el aviso.
          clearOfflineTimer();
          setDriverStatus(statusFromSnapshot(snapshot));
          setDriver(snapshot.exists() ? snapshot.data() : null);
          setError(null);
          setIsLoading(false);
        },
        (snapshotError) => {
          // Al cerrar sesión, Firestore puede rechazar la lectura antes de que
          // onAuthStateChanged avise: si ya no hay usuario, ese error se ignora.
          if (!auth.currentUser) {
            return;
          }
          clearOfflineTimer();
          console.log('Error escuchando el documento del conductor:', snapshotError.code);
          setError('session.loadError');
          setIsLoading(false);
        }
      );
    });

    // Limpieza: al desmontar el Provider se cierran las dos escuchas.
    return () => {
      unsubscribeAuth();
      stopDriverListener();
    };
  }, []);

  // useMemo: el objeto solo se crea de nuevo cuando cambia algún dato, así las
  // pantallas que usan el contexto no se vuelven a dibujar sin necesidad.
  const value = useMemo(
    () => ({ user, driver, driverStatus, isLoading, error }),
    [user, driver, driverStatus, isLoading, error]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
