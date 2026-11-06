// src/utils/validators.js
// Validaciones puras de formularios (sin estado ni red): se reutilizan en el
// inicio de sesión y en el registro del conductor, y se prueban con Jest.

// Correo: algo antes de la @, un dominio y una extensión de al menos 2 letras.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_PATTERN.test(value.trim());
}
