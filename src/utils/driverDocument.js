// src/utils/driverDocument.js
// Convierte el formulario de registro en el documento que se guarda en
// Firestore (drivers/{uid}). Es una función pura: no toca Firebase, así que
// se prueba con Jest. El service (driverService) le agrega las fechas del servidor.
// Estructura agrupada como las 3 pestañas: personal, vehicle, documents, payments.
// photoUrls trae las URL de Cloudinary (las fotos ya subidas), no las del celular.
import { PRICING } from '../config/pricing';
import { requiresTechnicalReview } from './validators';

export function buildDriverDocument(form, accountEmail, photoUrls, today = new Date()) {
  const needsTechnicalReview = requiresTechnicalReview(form.year, today);
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
      photoUrl: photoUrls.profile,
    },
    vehicle: {
      category: form.category,
      plate: form.plate,
      brand: form.brand.trim(),
      model: form.model.trim(),
      year: Number(form.year), // en el formulario es texto; en la base, número
      color: form.color,
      capacity: Number(form.capacity),
      photoUrl: photoUrls.vehicle,
    },
    documents: {
      licenseNumber: form.licenseNumber,
      licenseExpiry: form.licenseExpiry,
      licensePhotoUrl: photoUrls.license,
      soatExpiry: form.soatExpiry,
      soatPhotoUrl: photoUrls.soat,
      // Si no aplica para la edad del vehículo se guarda null (no una fecha vieja).
      technicalReviewExpiry: needsTechnicalReview ? form.technicalReviewExpiry : null,
      technicalReviewPhotoUrl: needsTechnicalReview ? photoUrls.technicalReview : null,
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
