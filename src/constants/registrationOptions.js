// src/constants/registrationOptions.js
// Opciones fijas de las listas desplegables del registro.
// "value" es el código que se guarda en Firestore (en inglés, como las
// categorías de pricing.js); "label" es el texto que ve el conductor.
export const GENDER_OPTIONS = Object.freeze([
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'other', label: 'Otro' },
  { value: 'undisclosed', label: 'Prefiero no decirlo' },
]);

export const LANGUAGE_OPTIONS = Object.freeze([
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'Inglés' },
]);

// Sirve para validar que el valor elegido sea uno de la lista.
export const isOptionValue = (options, value) => options.some((option) => option.value === value);
