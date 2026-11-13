// src/utils/driverProfile.js
// Funciones puras del Perfil (enunciado §3.7): pasar el documento del
// conductor al formulario del registro (así se reutilizan sus validaciones),
// armar los cambios a guardar y decidir si necesitan una nueva aprobación.
// Sin Firebase ni pantallas: se prueban con Jest.
import { buildDriverDocument } from './driverDocument';

// Se guardan directo: datos de contacto y preferencias, que no se comparan
// con ningún documento.
const DIRECT_FIELDS = Object.freeze(['language', 'personal.phone', 'payments.mercadoPagoEmail']);

// Vuelven a "Pendiente de aprobación": la identidad (foto, nombre, género), el
// vehículo y los documentos. Quien aprueba los compara con los documentos.
const REVIEW_FIELDS = Object.freeze([
  'personal.fullName',
  'personal.gender',
  'personal.photoUrl',
  'vehicle.category',
  'vehicle.plate',
  'vehicle.brand',
  'vehicle.model',
  'vehicle.year',
  'vehicle.color',
  'vehicle.capacity',
  'vehicle.photoUrl',
  'documents.licenseNumber',
  'documents.licenseExpiry',
  'documents.licensePhotoUrl',
  'documents.soatExpiry',
  'documents.soatPhotoUrl',
  'documents.technicalReviewExpiry',
  'documents.technicalReviewPhotoUrl',
]);

// No se editan (los verifica quien aprueba): correo de la cuenta, documento de
// identidad y fecha de nacimiento. No están en ninguna de las dos listas.

// Firestore entrega las fechas como Timestamp (con toDate()); en las pruebas
// y en el formulario son Date.
function toDate(value) {
  if (value instanceof Date) return value;
  const date = value?.toDate?.();
  return date instanceof Date ? date : null;
}

// Lee un campo con ruta 'mapa.campo' (ej. 'vehicle.plate').
const getAt = (object, path) => path.split('.').reduce((value, key) => value?.[key], object);

// Dos fechas son iguales si son el mismo instante (Timestamp o Date); el resto
// se compara con ===.
function isSameValue(a, b) {
  const dateA = toDate(a);
  const dateB = toDate(b);
  if (dateA || dateB) return dateA?.getTime() === dateB?.getTime();
  return a === b;
}

// Documento del conductor → formulario con la misma forma que el del registro.
// Las fotos quedan con su URL de Cloudinary; si el conductor elige otra, pasa a
// ser una uri local del celular.
export function profileFormFromDriver(driver) {
  const { personal, vehicle, documents, payments } = driver;
  return {
    profilePhoto: personal.photoUrl,
    fullName: personal.fullName,
    documentNumber: personal.documentNumber,
    phone: personal.phone,
    birthDate: toDate(personal.birthDate),
    gender: personal.gender,
    language: driver.language,
    category: vehicle.category,
    plate: vehicle.plate,
    brand: vehicle.brand,
    model: vehicle.model,
    year: String(vehicle.year), // en el formulario es texto (igual que en el TextInput)
    color: vehicle.color,
    capacity: String(vehicle.capacity),
    vehiclePhoto: vehicle.photoUrl,
    licenseNumber: documents.licenseNumber,
    licenseExpiry: toDate(documents.licenseExpiry),
    licensePhoto: documents.licensePhotoUrl,
    soatExpiry: toDate(documents.soatExpiry),
    soatPhoto: documents.soatPhotoUrl,
    technicalReviewExpiry: toDate(documents.technicalReviewExpiry),
    technicalReviewPhoto: documents.technicalReviewPhotoUrl,
    mercadoPagoEmail: payments.mercadoPagoEmail,
    termsAccepted: true, // ya los aceptó al registrarse
  };
}

// Las fotos tal como están en el formulario (URL de Cloudinary o uri local).
const photosFromForm = (form) => ({
  profile: form.profilePhoto,
  vehicle: form.vehiclePhoto,
  license: form.licensePhoto,
  soat: form.soatPhoto,
  technicalReview: form.technicalReviewPhoto,
});

// Arma los cambios del perfil con la misma función del registro
// (buildDriverDocument), pero conserva lo que no se edita.
// photoUrls: las URL ya subidas; si no se pasan, se usan las del formulario
// (sirve para saber ANTES de subir si una foto cambió).
// Devuelve:
//   update: los mapas a guardar con updateDoc (status incluido);
//   changedFields: rutas de los campos que cambiaron;
//   needsReview: true si alguno vuelve a "Pendiente de aprobación".
export function buildProfileUpdate(driver, form, photoUrls = photosFromForm(form), today = new Date()) {
  const built = buildDriverDocument(form, driver.email, photoUrls, today);
  const next = {
    language: built.language,
    personal: {
      ...built.personal,
      // No editables: siempre los del documento guardado.
      documentNumber: driver.personal.documentNumber,
      birthDate: driver.personal.birthDate,
    },
    vehicle: built.vehicle,
    documents: built.documents,
    payments: built.payments,
  };

  const changedFields = [...DIRECT_FIELDS, ...REVIEW_FIELDS].filter(
    (path) => !isSameValue(getAt(driver, path), getAt(next, path))
  );
  const needsReview = changedFields.some((path) => REVIEW_FIELDS.includes(path));

  return {
    update: { ...next, status: needsReview ? 'pending' : driver.status },
    changedFields,
    needsReview,
  };
}

// Una foto nueva es una uri local del celular (file://...); las guardadas
// son URL https de Cloudinary.
export const isLocalPhoto = (uri) => typeof uri === 'string' && !uri.startsWith('https://');
