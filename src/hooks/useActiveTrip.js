// src/hooks/useActiveTrip.js
// Hook para leer el ActiveTripContext (igual que useSession con su context).
import { useContext } from 'react';
import { ActiveTripContext } from '../context/ActiveTripContext';

export default function useActiveTrip() {
  const context = useContext(ActiveTripContext);
  if (!context) {
    throw new Error('useActiveTrip debe usarse dentro de un <ActiveTripProvider>.');
  }
  return context;
}
