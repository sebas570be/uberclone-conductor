// src/i18n/labels.js
// Texto en el idioma actual para los CÓDIGOS que se guardan en Firestore
// (género, categoría, color, método y estado del pago). Los datos guardan
// códigos ('gray', 'cash'); la pantalla decide el idioma con t.
// AI-assisted: see docs/AI_LOG.md #18
import { TRIP_STATUS } from '../config/tripRequest';

// optionLabel(t, 'color', 'gray') → 'Gris' / 'Gray'. '' si no hay valor.
export const optionLabel = (t, group, value) => (value ? t(`options.${group}.${value}`) : '');

export const paymentMethodText = (t, paymentMethod) => (paymentMethod ? t(`paymentMethod.${paymentMethod}`) : '');

// Estado del cobro (S4). Sin estado todavía: "Pendiente".
export const paymentStatusText = (t, paymentStatus) => t(`paymentStatus.${paymentStatus ?? 'pending'}`);

// Historial (HI3): los finalizados sin pagar dicen "Pendiente de pago";
// los pagados, cómo se pagó.
export const historyStatusText = (t, trip) =>
  trip.status === TRIP_STATUS.COMPLETED ? t('paymentStatus.unpaid') : paymentStatusText(t, trip.paymentStatus);
