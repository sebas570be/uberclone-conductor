// src/utils/driverDocument.js
// Convierte el formulario de registro en el documento que se guarda en
// Firestore (drivers/{uid}). Es una función pura: no toca Firebase, así que
// se prueba con Jest. El service (driverService) le agrega las fechas del servidor.
// Estructura agrupada como las 3 pestañas: personal, vehicle, documents, payments.
import { PRICING } from '../config/pricing';
import { requiresTechnicalReview } from './validators';

export function buildDriverDocument(form, accountEmail, today = new Date()) {
  return {
    // Siempre "pending": el conductor no puede aprobarse solo (las reglas de
    // Firestore también lo exigen al crear el documento).
    status: 'pending',
    email: accountEmail, // correo de la cuenta (Firebase Auth)
    language: form.language,
    personal: {
      fullName: form.fullName.trim(),
      documentNumber: form.documentNumber,
      phone: form.phone,
      birthDate: form.birthDate, // Date → Firestore lo guarda como Timestamp
      gender: form.gender,
    },
    vehicle: {
      category: form.category,
      plate: form.plate,
      brand: form.brand.trim(),
      model: form.model.trim(),
      year: Number(form.year), // en el formulario es texto; en la base, número
      color: form.color,
      capacity: Number(form.capacity),
    },
    documents: {
      licenseNumber: form.licenseNumber,
      licenseExpiry: form.licenseExpiry,
      soatExpiry: form.soatExpiry,
      // Si no aplica para la edad del vehículo se guarda null (no una fecha vieja).
      technicalReviewExpiry: requiresTechnicalReview(form.year, today) ? form.technicalReviewExpiry : null,
    },
    payments: {
      // Solo el correo de Mercado Pago: el enunciado prohíbe guardar cuentas o tarjetas.
      mercadoPagoEmail: form.mercadoPagoEmail.trim().toLowerCase(),
    },
    terms: {
      accepted: true,
      // Se guarda la comisión que el conductor aceptó: si mañana cambia en
      // pricing.js, queda constancia de la que estaba vigente al registrarse.
      commissionRate: PRICING.commissionRate,
    },
  };
}
