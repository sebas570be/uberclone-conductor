// src/constants/registrationOptions.js
// Opciones fijas de las listas desplegables del registro.
// "value" es el código que se guarda en Firestore (en inglés, como las
// categorías de pricing.js). El texto que ve el conductor sale de src/i18n
// (options.gender.male, options.color.gray...) con translatedOptions.
export const GENDER_OPTIONS = Object.freeze([
  { value: 'male' },
  { value: 'female' },
  { value: 'other' },
  { value: 'undisclosed' },
]);

export const LANGUAGE_OPTIONS = Object.freeze([
  { value: 'es' },
  { value: 'en' },
]);

// Categorías: los códigos son los mismos de pricing.js (categoryMultipliers).
export const CATEGORY_OPTIONS = Object.freeze([
  { value: 'economy' },
  { value: 'xl' },
  { value: 'premium' },
]);

export const COLOR_OPTIONS = Object.freeze([
  { value: 'white' },
  { value: 'black' },
  { value: 'gray' },
  { value: 'silver' },
  { value: 'red' },
  { value: 'blue' },
  { value: 'green' },
  { value: 'other' },
]);

// Sirve para validar que el valor elegido sea uno de la lista.
export const isOptionValue = (options, value) => options.some((option) => option.value === value);
