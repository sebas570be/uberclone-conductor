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

// Categorías: los códigos son los mismos de pricing.js (categoryMultipliers).
export const CATEGORY_OPTIONS = Object.freeze([
  { value: 'economy', label: 'Económico' },
  { value: 'xl', label: 'XL' },
  { value: 'premium', label: 'Premium' },
]);

export const COLOR_OPTIONS = Object.freeze([
  { value: 'white', label: 'Blanco' },
  { value: 'black', label: 'Negro' },
  { value: 'gray', label: 'Gris' },
  { value: 'silver', label: 'Plateado' },
  { value: 'red', label: 'Rojo' },
  { value: 'blue', label: 'Azul' },
  { value: 'green', label: 'Verde' },
  { value: 'other', label: 'Otro' },
]);

// Texto que ve el conductor para un código (ej. 'xl' → 'XL'); '' si no existe.
export const labelFor = (options, value) => options.find((option) => option.value === value)?.label ?? '';

// Sirve para validar que el valor elegido sea uno de la lista.
export const isOptionValue = (options, value) => options.some((option) => option.value === value);
