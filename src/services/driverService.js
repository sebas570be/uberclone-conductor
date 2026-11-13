// src/services/driverService.js
// Único lugar de la app que escribe el documento del conductor en Firestore
// (arquitectura por capas: las pantallas no usan Firebase directamente).
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { buildDriverDocument } from '../utils/driverDocument';
import { buildProfileUpdate, isLocalPhoto, profileFormFromDriver } from '../utils/driverProfile';
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

// Perfil: sube SOLO las fotos nuevas (uri local) y deja igual las que ya
// están en Cloudinary. La de la revisión solo si aplica.
async function uploadNewPhotos(form) {
  const upload = (uri) => (isLocalPhoto(uri) ? uploadPhoto(uri) : Promise.resolve(uri));
  const needsTechnicalReview = requiresTechnicalReview(form.year);
  const [profile, vehicle, license, soat, technicalReview] = await Promise.all([
    upload(form.profilePhoto),
    upload(form.vehiclePhoto),
    upload(form.licensePhoto),
    upload(form.soatPhoto),
    needsTechnicalReview ? upload(form.technicalReviewPhoto) : Promise.resolve(null),
  ]);
  return { profile, vehicle, license, soat, technicalReview };
}

// Guarda los cambios del perfil en drivers/{uid}.
// 1) sube las fotos nuevas; 2) arma los cambios (buildProfileUpdate decide si
// vuelve a "pending"); 3) updateDoc solo si algo cambió.
// Si vuelve a "pending", el SessionContext lo detecta y RootNavigator muestra
// "Pendiente de aprobación" (igual que después del registro).
// Devuelve { changedFields, needsReview }.
export async function updateDriverProfile(uid, driver, form) {
  const photoUrls = await uploadNewPhotos(form);
  const { update, changedFields, needsReview } = buildProfileUpdate(driver, form, photoUrls);
  if (changedFields.length > 0) {
    await updateDoc(doc(db, 'drivers', uid), update);
  }
  return { changedFields, needsReview };
}

// Idioma (Configuración): se guarda con la misma función del perfil. Es un
// campo directo: el conductor sigue aprobado.
export function updateDriverLanguage(uid, driver, language) {
  return updateDriverProfile(uid, driver, { ...profileFormFromDriver(driver), language });
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
