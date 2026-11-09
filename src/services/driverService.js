// src/services/driverService.js
// Único lugar de la app que escribe el documento del conductor en Firestore
// (arquitectura por capas: las pantallas no usan Firebase directamente).
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { buildDriverDocument } from '../utils/driverDocument';

// Guarda el registro en drivers/{uid} con estado "pending".
// No hace falta navegar después: el SessionContext escucha este documento y,
// al aparecer, RootNavigator cambia solo a "Pendiente de aprobación".
export async function submitRegistration(uid, accountEmail, form) {
  const driver = buildDriverDocument(form, accountEmail);
  await setDoc(doc(db, 'drivers', uid), {
    ...driver,
    // Hora del SERVIDOR, no la del celular (que puede estar mal configurada).
    createdAt: serverTimestamp(),
  });
}

// Mensajes en español para los errores de Firestore.
const ERROR_MESSAGES = {
  'permission-denied': 'No tienes permiso para guardar este registro. Cierra sesión y vuelve a entrar.',
  unavailable: 'Sin conexión. Revisa tu internet e intenta de nuevo.',
};

export function getDriverErrorMessage(error) {
  return ERROR_MESSAGES[error?.code] ?? 'No se pudo enviar el registro. Intenta de nuevo.';
}
