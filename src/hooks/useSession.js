// src/hooks/useSession.js
// Hook para leer el SessionContext. Si se usa fuera del SessionProvider avisa
// con un error claro, en vez de fallar después con datos vacíos.
// AI-assisted: see docs/AI_LOG.md #3
import { useContext } from 'react';
import { SessionContext } from '../context/SessionContext';

export default function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession debe usarse dentro de un <SessionProvider>.');
  }
  return context;
}
