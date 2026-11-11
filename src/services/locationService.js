// src/services/locationService.js
// Único lugar que escribe la ubicación del conductor en Firestore.
// Colección aparte de drivers/{uid}: el registro (datos personales y
// documentos) no se toca cada 5 segundos, y quien necesite saber dónde está
// el conductor no tiene que leer sus datos personales.
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { buildLocationDocument } from '../utils/locationDocument';

export async function saveDriverLocation(uid, isAvailable, coords) {
  await setDoc(doc(db, 'driverLocations', uid), {
    ...buildLocationDocument(isAvailable, coords),
    // Hora del servidor: las reglas exigen updatedAt == request.time.
    updatedAt: serverTimestamp(),
  });
}
