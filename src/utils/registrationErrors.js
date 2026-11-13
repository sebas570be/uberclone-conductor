// src/utils/registrationErrors.js
// Arma los errores de cada pestaña del registro a partir de los datos del
// formulario. Es una función pura (sin estado ni red): la usan las pantallas
// para mostrar el error debajo de cada campo y el botón "Enviar registro" para
// saber si todo está completo. Se prueba con Jest.
// Devuelve un objeto { campo: error } solo con los campos que tienen error.
// Cada error es { key, params }: la CLAVE del texto en src/i18n y sus datos.
// El campo (FormField) lo muestra en el idioma elegido con errorText.
import { REGISTRATION_RULES } from '../config/registration';
import {
  GENDER_OPTIONS,
  LANGUAGE_OPTIONS,
  CATEGORY_OPTIONS,
  COLOR_OPTIONS,
  isOptionValue,
} from '../constants/registrationOptions';
import {
  isValidFullName,
  isValidDocumentNumber,
  isValidPhone,
  isAdult,
  isValidPlate,
  isValidBrandOrModel,
  isValidVehicleYear,
  isValidCapacity,
  isValidEmail,
  isFutureDate,
  requiresTechnicalReview,
} from './validators';

// error('phone') → { key: 'errors.phone', params: {} }
const error = (name, params = {}) => ({ key: `errors.${name}`, params });

export function getPersonalDataErrors(form, today = new Date()) {
  const errors = {};

  if (!form.profilePhoto) {
    errors.profilePhoto = error('profilePhoto');
  }
  if (!isValidFullName(form.fullName)) {
    errors.fullName = error('fullName', { max: REGISTRATION_RULES.maxNameLength });
  }
  if (!isValidDocumentNumber(form.documentNumber)) {
    errors.documentNumber = error('documentNumber');
  }
  if (!isValidPhone(form.phone)) {
    errors.phone = error('phone');
  }
  if (!form.birthDate) {
    errors.birthDate = error('birthDateMissing');
  } else if (!isAdult(form.birthDate, today)) {
    errors.birthDate = error('underAge', { age: REGISTRATION_RULES.minAge });
  }
  if (!isOptionValue(GENDER_OPTIONS, form.gender)) {
    errors.gender = error('gender');
  }
  if (!isOptionValue(LANGUAGE_OPTIONS, form.language)) {
    errors.language = error('language');
  }

  return errors;
}

export function getVehicleErrors(form, today = new Date()) {
  const errors = {};
  const maxLength = REGISTRATION_RULES.maxBrandModelLength;

  if (!isOptionValue(CATEGORY_OPTIONS, form.category)) {
    errors.category = error('category');
  }
  if (!isValidPlate(form.plate)) {
    errors.plate = error('plate');
  }
  if (!isValidBrandOrModel(form.brand)) {
    errors.brand = error('brand', { max: maxLength });
  }
  if (!isValidBrandOrModel(form.model)) {
    errors.model = error('model', { max: maxLength });
  }
  if (!isValidVehicleYear(form.year, today)) {
    errors.year = error('year', { min: REGISTRATION_RULES.minVehicleYear, max: today.getFullYear() });
  }
  if (!isOptionValue(COLOR_OPTIONS, form.color)) {
    errors.color = error('color');
  }
  // La capacidad depende de la categoría: como los errores se calculan desde
  // todo el formulario, si cambia la categoría este mensaje se actualiza solo.
  if (!form.vehiclePhoto) {
    errors.vehiclePhoto = error('vehiclePhoto');
  }
  if (!isValidCapacity(form.capacity, form.category)) {
    const minimum = REGISTRATION_RULES.minCapacity[form.category];
    // El nombre de la categoría va como clave: se traduce al mostrarse.
    errors.capacity =
      minimum === undefined
        ? error('capacityNoCategory')
        : error('capacity', { min: minimum, category: { key: `options.category.${form.category}` } });
  }

  return errors;
}

// Fecha de vencimiento obligatoria y posterior a hoy (enunciado: vencimiento > hoy).
// missingName: el error cuando falta la fecha (uno por documento).
function expiryError(date, today, missingName) {
  if (!date) return error(missingName);
  if (!isFutureDate(date, today)) return error('expired');
  return undefined;
}

export function getDocumentsErrors(form, today = new Date()) {
  const errors = {};

  // En Colombia el número de la licencia de conducción es el de la cédula:
  // misma regla que el documento (6 a 10 números). Ver README.
  if (!isValidDocumentNumber(form.licenseNumber)) {
    errors.licenseNumber = error('licenseNumber');
  }
  const licenseError = expiryError(form.licenseExpiry, today, 'licenseExpiryMissing');
  if (licenseError) errors.licenseExpiry = licenseError;
  if (!form.licensePhoto) errors.licensePhoto = error('licensePhoto');

  const soatError = expiryError(form.soatExpiry, today, 'soatExpiryMissing');
  if (soatError) errors.soatExpiry = soatError;
  if (!form.soatPhoto) errors.soatPhoto = error('soatPhoto');

  // La revisión técnico-mecánica solo se exige si el vehículo tiene 5 años o
  // más (regla en src/config/registration.js). Si no aplica, no hay error.
  if (requiresTechnicalReview(form.year, today)) {
    const reviewError = expiryError(form.technicalReviewExpiry, today, 'technicalReviewExpiryMissing');
    if (reviewError) errors.technicalReviewExpiry = reviewError;
    if (!form.technicalReviewPhoto) errors.technicalReviewPhoto = error('technicalReviewPhoto');
  }

  if (!isValidEmail(form.mercadoPagoEmail)) {
    errors.mercadoPagoEmail = error('mercadoPagoEmail');
  }
  if (form.termsAccepted !== true) {
    errors.termsAccepted = error('termsAccepted');
  }

  return errors;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;
