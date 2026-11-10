// src/utils/validators.js
// Validaciones puras de formularios (sin estado ni red): se reutilizan en el
// inicio de sesión y en el registro del conductor, y se prueban con Jest.
// Cada función devuelve true o false; el mensaje de error lo pone la pantalla.
import { REGISTRATION_RULES } from '../config/registration';

// Correo: algo antes de la @, un dominio y una extensión de al menos 2 letras.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Solo letras (con tildes, ñ y ü) y espacios.
const NAME_PATTERN = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$/;
const DOCUMENT_PATTERN = /^\d{6,10}$/;
const PHONE_PATTERN = /^\d{10}$/;
// Placa colombiana de carro particular: 3 letras y 3 números (ABC123).
const PLATE_PATTERN = /^[A-Z]{3}\d{3}$/;
const YEAR_PATTERN = /^\d{4}$/;
const CAPACITY_PATTERN = /^\d{1,2}$/;

const isText = (value) => typeof value === 'string';

export function isValidEmail(value) {
  return isText(value) && EMAIL_PATTERN.test(value.trim());
}

// ---------- Pestaña 1: datos personales ----------

export function isValidFullName(value) {
  if (!isText(value)) return false;
  const name = value.trim(); // "   " queda vacío y se rechaza
  return name.length > 0 && name.length <= REGISTRATION_RULES.maxNameLength && NAME_PATTERN.test(name);
}

export function isValidDocumentNumber(value) {
  return isText(value) && DOCUMENT_PATTERN.test(value);
}

export function isValidPhone(value) {
  return isText(value) && PHONE_PATTERN.test(value);
}

const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());

// Edad comparando año, mes y día: restar solo los años falla si la persona
// todavía no ha cumplido años este año.
export function getAge(birthDate, today = new Date()) {
  if (!isValidDate(birthDate)) return NaN;
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

export function isAdult(birthDate, today = new Date()) {
  return getAge(birthDate, today) >= REGISTRATION_RULES.minAge; // NaN >= 18 es false
}

// ---------- Pestaña 2: vehículo ----------

// El enunciado pide pasar a mayúsculas ANTES de validar: la pantalla guarda
// normalizePlate(texto) y luego valida con isValidPlate (que no convierte).
export function normalizePlate(value) {
  return isText(value) ? value.trim().toUpperCase() : '';
}

export function isValidPlate(value) {
  return isText(value) && PLATE_PATTERN.test(value);
}

export function isValidBrandOrModel(value) {
  if (!isText(value)) return false;
  const text = value.trim();
  return text.length > 0 && text.length <= REGISTRATION_RULES.maxBrandModelLength;
}

export function isValidVehicleYear(value, today = new Date()) {
  if (!isText(value) || !YEAR_PATTERN.test(value)) return false;
  const year = Number(value);
  return year >= REGISTRATION_RULES.minVehicleYear && year <= today.getFullYear();
}

// La capacidad depende de la categoría (XL exige más puestos). Si cambia la
// categoría, la pantalla debe volver a validar la capacidad.
export function isValidCapacity(value, category) {
  const minimum = REGISTRATION_RULES.minCapacity[category];
  if (minimum === undefined || !isText(value) || !CAPACITY_PATTERN.test(value)) return false;
  return Number(value) >= minimum;
}

// ---------- Pestaña 3: documentos ----------

// Fecha sin la hora: así "vence hoy a las 11 p. m." no cuenta como vigente.
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

// Vencimiento > hoy (estrictamente después de hoy).
export function isFutureDate(date, today = new Date()) {
  return isValidDate(date) && startOfDay(date) > startOfDay(today);
}

// La revisión técnico-mecánica solo es obligatoria si el vehículo tiene
// technicalReviewAfterYears años o más. Se calcula con el año del modelo
// porque la app no pide la fecha de matrícula (simplificación documentada).
export function requiresTechnicalReview(vehicleYear, today = new Date()) {
  if (!isValidVehicleYear(vehicleYear, today)) return false;
  return today.getFullYear() - Number(vehicleYear) >= REGISTRATION_RULES.technicalReviewAfterYears;
}
