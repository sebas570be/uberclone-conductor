// src/hooks/useRegistration.js
// Hook para leer el RegistrationContext, igual que useSession.
import { useContext } from 'react';
import { RegistrationContext } from '../context/RegistrationContext';

export default function useRegistration() {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration debe usarse dentro de un <RegistrationProvider>.');
  }
  return context;
}
