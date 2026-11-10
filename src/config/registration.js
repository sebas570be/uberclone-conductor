// src/config/registration.js
// Reglas del registro del conductor en un solo archivo, igual que pricing.js:
// si cambia una regla (por ejemplo, la edad mínima), se cambia solo aquí.
// Las que el enunciado no define están marcadas y justificadas en el README.
export const REGISTRATION_RULES = Object.freeze({
  minAge: 18, // enunciado: mayor de 18
  maxNameLength: 50, // enunciado: nombre completo máx. 50
  maxBrandModelLength: 30, // enunciado: marca y modelo máx. 30 cada uno
  minVehicleYear: 2000, // NO lo define el enunciado (solo "≤ año actual")
  technicalReviewAfterYears: 5, // NO lo define ("si aplica según el año"): regla de particulares en Colombia
  minCapacity: Object.freeze({
    economy: 4, // NO lo define el enunciado
    xl: 6, // enunciado: XL mínimo 6
    premium: 4, // NO lo define el enunciado
  }),
});
