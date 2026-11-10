// src/services/driverService.js
// Único lugar de la app que escribe el documento del conductor en Firestore
// (arquitectura por capas: las pantallas no usan Firebase directamente).
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { buildDriverDocument } from '../utils/driverDocument';
import { requiresTechnicalReview } from '../utils/validators';
import { uploadPhoto } from './photoService';

// Sube las fotos del formulario a Cloudinary AL MISMO TIEMPO (Promise.all) y
// devuelve sus URL. La de la revisión solo se sube si aplica.
async function uploadRegistrationPhotos(form) {
  const needsTechnicalReview = requiresTechnicalReview(form.year);
  const [profile, vehicle, license, soat, technicalReview] = await Promise.all([
    uploadPhoto(form.profilePhoto),
    uploadPhoto(form.vehiclePhoto),
    uploadPhoto(form.licensePhoto),
    uploadPhoto(form.soatPhoto),
    needsTechnicalReview ? uploadPhoto(form.technicalReviewPhoto) : Promise.resolve(null),
  ]);
  return { profile, vehicle, license, soat, technicalReview };
}

// Guarda el registro en drivers/{uid} con estado "pending".
// 1) sube las fotos; 2) guarda el documento con sus URL. Si falla una foto,
// no se guarda nada (el conductor puede volver a intentar).
// No hace falta navegar después: el SessionContext escucha este documento y,
// al aparecer, RootNavigator cambia solo a "Pendiente de aprobación".
export async function submitRegistration(uid, accountEmail, form) {
  const photoUrls = await uploadRegistrationPhotos(form);
  const driver = buildDriverDocument(form, accountEmail, photoUrls);
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
  'photo-upload-failed': 'No se pudieron subir las fotos. Revisa tu internet e intenta de nuevo.',
};

export function getDriverErrorMessage(error) {
  // Sin internet, fetch lanza TypeError ("Network request failed") sin código.
  if (error instanceof TypeError) return ERROR_MESSAGES.unavailable;
  return ERROR_MESSAGES[error?.code] ?? 'No se pudo enviar el registro. Intenta de nuevo.';
}
