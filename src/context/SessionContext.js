// src/context/SessionContext.js
// Context de sesión: guarda en qué situación está el conductor para que la
// navegación raíz (RootNavigator) decida qué pantallas mostrar.
// Por ahora el estado es SIMULADO: se cambia a mano INITIAL_STATUS para probar
// cada caso. Cuando llegue Firebase, este archivo leerá el estado real
// (sesión + documento del conductor) y los navegadores no cambian.
// AI-assisted: see docs/AI_LOG.md #3
import React, { createContext, useMemo, useState } from 'react';

// Estados posibles del conductor, en el orden en que avanza.
export const DRIVER_STATUS = Object.freeze({
  SIGNED_OUT: 'signedOut', // sin sesión
  UNREGISTERED: 'unregistered', // tiene cuenta, pero no ha enviado el registro
  PENDING: 'pending', // registro enviado, esperando aprobación
  APPROVED: 'approved', // aprobado: puede usar la app
});

// Valor para probar: cámbialo, guarda y la app muestra otra rama del árbol.
const INITIAL_STATUS = DRIVER_STATUS.APPROVED;

export const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [driverStatus, setDriverStatus] = useState(INITIAL_STATUS);

  // useMemo: el objeto solo se crea de nuevo cuando cambia el estado, así las
  // pantallas que usan el contexto no se vuelven a dibujar sin necesidad.
  const value = useMemo(() => ({ driverStatus, setDriverStatus }), [driverStatus]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
