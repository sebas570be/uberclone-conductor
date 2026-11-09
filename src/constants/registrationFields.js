// src/constants/registrationFields.js
// Campos de cada pestaña del registro. Los usan las pantallas (botón
// "Siguiente") y RegisterTabs (bloqueo de pestañas) para marcar como visitados
// todos los campos de una pestaña y mostrar sus errores.
export const PERSONAL_DATA_FIELDS = Object.freeze([
  'fullName',
  'documentNumber',
  'phone',
  'birthDate',
  'gender',
  'language',
]);

export const VEHICLE_FIELDS = Object.freeze(['category', 'plate', 'brand', 'model', 'year', 'color', 'capacity']);
