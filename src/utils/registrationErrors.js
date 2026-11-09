// src/utils/registrationErrors.js
// Arma los mensajes de error de cada pestaña del registro a partir de los
// datos del formulario. Es una función pura (sin estado ni red): la usan las
// pantallas para mostrar el error debajo de cada campo y el botón "Enviar
// registro" para saber si todo está completo. Se prueba con Jest.
// Devuelve un objeto { campo: mensaje } solo con los campos que tienen error.
import { REGISTRATION_RULES } from '../config/registration';
import { GENDER_OPTIONS, LANGUAGE_OPTIONS, isOptionValue } from '../constants/registrationOptions';
import { isValidFullName, isValidDocumentNumber, isValidPhone, isAdult } from './validators';

export function getPersonalDataErrors(form, today = new Date()) {
  const errors = {};

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

export const hasErrors = (errors) => Object.keys(errors).length > 0;
