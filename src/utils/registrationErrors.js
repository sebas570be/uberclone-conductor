// src/utils/registrationErrors.js
// Arma los mensajes de error de cada pestaña del registro a partir de los
// datos del formulario. Es una función pura (sin estado ni red): la usan las
// pantallas para mostrar el error debajo de cada campo y el botón "Enviar
// registro" para saber si todo está completo. Se prueba con Jest.
// Devuelve un objeto { campo: mensaje } solo con los campos que tienen error.
import { REGISTRATION_RULES } from '../config/registration';
import {
  GENDER_OPTIONS,
  LANGUAGE_OPTIONS,
  CATEGORY_OPTIONS,
  COLOR_OPTIONS,
  isOptionValue,
  labelFor,
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

export function getPersonalDataErrors(form, today = new Date()) {
  const errors = {};

  if (!form.profilePhoto) {
    errors.profilePhoto = 'Agrega tu foto de perfil.';
  }
  if (!isValidFullName(form.fullName)) {
    errors.fullName = `Escribe tu nombre completo: solo letras y espacios, máximo ${REGISTRATION_RULES.maxNameLength}.`;
  }
  if (!isValidDocumentNumber(form.documentNumber)) {
    errors.documentNumber = 'El documento debe tener entre 6 y 10 números.';
  }
  if (!isValidPhone(form.phone)) {
    errors.phone = 'El celular debe tener 10 números.';
  }
  if (!form.birthDate) {
    errors.birthDate = 'Elige tu fecha de nacimiento.';
  } else if (!isAdult(form.birthDate, today)) {
    errors.birthDate = `Debes ser mayor de ${REGISTRATION_RULES.minAge} años para registrarte.`;
  }
  if (!isOptionValue(GENDER_OPTIONS, form.gender)) {
    errors.gender = 'Elige una opción.';
  }
  if (!isOptionValue(LANGUAGE_OPTIONS, form.language)) {
    errors.language = 'Elige un idioma.';
  }

  return errors;
}

export function getVehicleErrors(form, today = new Date()) {
  const errors = {};
  const maxLength = REGISTRATION_RULES.maxBrandModelLength;

  if (!isOptionValue(CATEGORY_OPTIONS, form.category)) {
    errors.category = 'Elige la categoría del vehículo.';
  }
  if (!isValidPlate(form.plate)) {
    errors.plate = 'La placa debe tener 3 letras y 3 números (ejemplo: ABC123).';
  }
  if (!isValidBrandOrModel(form.brand)) {
    errors.brand = `Escribe la marca (máximo ${maxLength} caracteres).`;
  }
  if (!isValidBrandOrModel(form.model)) {
    errors.model = `Escribe el modelo (máximo ${maxLength} caracteres).`;
  }
  if (!isValidVehicleYear(form.year, today)) {
    errors.year = `Escribe un año de 4 números entre ${REGISTRATION_RULES.minVehicleYear} y ${today.getFullYear()}.`;
  }
  if (!isOptionValue(COLOR_OPTIONS, form.color)) {
    errors.color = 'Elige el color.';
  }
  // La capacidad depende de la categoría: como los errores se calculan desde
  // todo el formulario, si cambia la categoría este mensaje se actualiza solo.
  if (!form.vehiclePhoto) {
    errors.vehiclePhoto = 'Agrega una foto del vehículo donde se vea la placa.';
  }
  if (!isValidCapacity(form.capacity, form.category)) {
    const minimum = REGISTRATION_RULES.minCapacity[form.category];
    errors.capacity =
      minimum === undefined
        ? 'Elige primero la categoría para saber la capacidad mínima.'
        : `Escribe la capacidad: mínimo ${minimum} pasajeros para ${labelFor(CATEGORY_OPTIONS, form.category)}.`;
  }

  return errors;
}

// Fecha de vencimiento obligatoria y posterior a hoy (enunciado: vencimiento > hoy).
function expiryError(date, today, name) {
  if (!date) return `Elige la fecha de vencimiento ${name}.`;
  if (!isFutureDate(date, today)) return 'Está vencido: la fecha de vencimiento debe ser posterior a hoy.';
  return undefined;
}

export function getDocumentsErrors(form, today = new Date()) {
  const errors = {};

  // En Colombia el número de la licencia de conducción es el de la cédula:
  // misma regla que el documento (6 a 10 números). Ver README.
  if (!isValidDocumentNumber(form.licenseNumber)) {
    errors.licenseNumber = 'El número de licencia debe tener entre 6 y 10 números.';
  }
  const licenseError = expiryError(form.licenseExpiry, today, 'de la licencia');
  if (licenseError) errors.licenseExpiry = licenseError;
  if (!form.licensePhoto) errors.licensePhoto = 'Agrega una foto de tu licencia.';

  const soatError = expiryError(form.soatExpiry, today, 'del SOAT');
  if (soatError) errors.soatExpiry = soatError;
  if (!form.soatPhoto) errors.soatPhoto = 'Agrega una foto del SOAT.';

  // La revisión técnico-mecánica solo se exige si el vehículo tiene 5 años o
  // más (regla en src/config/registration.js). Si no aplica, no hay error.
  if (requiresTechnicalReview(form.year, today)) {
    const reviewError = expiryError(form.technicalReviewExpiry, today, 'de la revisión técnico-mecánica');
    if (reviewError) errors.technicalReviewExpiry = reviewError;
    if (!form.technicalReviewPhoto) errors.technicalReviewPhoto = 'Agrega una foto de la revisión técnico-mecánica.';
  }

  if (!isValidEmail(form.mercadoPagoEmail)) {
    errors.mercadoPagoEmail = 'Escribe el correo de tu cuenta de Mercado Pago (ejemplo: nombre@gmail.com).';
  }
  if (form.termsAccepted !== true) {
    errors.termsAccepted = 'Debes aceptar los términos para enviar el registro.';
  }

  return errors;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;
