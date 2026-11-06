// src/context/SessionContext.js
// Context de sesión: dice en qué situación está el conductor para que la
// navegación raíz (RootNavigator) decida qué pantallas mostrar.
// Escucha a Firebase en tiempo real:
//   1) onAuthStateChanged: ¿hay un usuario con sesión iniciada?
//   2) onSnapshot de drivers/{uid}: ¿ya envió su registro? ¿está aprobado?
// Si el estado cambia en la base de datos (por ejemplo, de "pending" a
// "approved" desde la consola), la app cambia de pantalla sola.
// AI-assisted: see docs/AI_LOG.md #6
import React, { createContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Estados posibles del conductor, en el orden en que avanza.
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
  // Empieza en true: al abrir la app, Firebase tarda un momento en decir si
  // había una sesión guardada. Sin esto se vería el login por un instante.
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Escucha del documento del conductor; se cambia cada vez que cambia el usuario.
    let unsubscribeDriver = null;
    const stopDriverListener = () => {
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
      setError(null);

      if (!firebaseUser) {
        setDriverStatus(DRIVER_STATUS.SIGNED_OUT);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      unsubscribeDriver = onSnapshot(
        doc(db, 'drivers', firebaseUser.uid),
        (snapshot) => {
          // Sin conexión y sin datos guardados, Firestore responde "no existe" desde
          // su caché local. Eso NO significa que no se haya registrado: es falta de
          // conexión. Cuando vuelva internet llega la respuesta real y se corrige sola.
          if (!snapshot.exists() && snapshot.metadata.fromCache) {
            setError('Sin conexión. Conéctate a internet para cargar tu información.');
            setIsLoading(false);
            return;
          }
          setDriverStatus(statusFromSnapshot(snapshot));
          setError(null);
          setIsLoading(false);
        },
        (snapshotError) => {
          // Al cerrar sesión, Firestore puede rechazar la lectura antes de que
          // onAuthStateChanged avise: si ya no hay usuario, ese error se ignora.
          if (!auth.currentUser) {
            return;
          }
          console.log('Error escuchando el documento del conductor:', snapshotError.code);
          setError('No se pudo cargar tu información. Revisa tu conexión e intenta de nuevo.');
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
    () => ({ user, driverStatus, isLoading, error }),
    [user, driverStatus, isLoading, error]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
