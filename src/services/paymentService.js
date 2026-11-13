// src/services/paymentService.js
// Cobro con Mercado Pago desde la app (enunciado G1-G12). La app NO habla con
// Mercado Pago: le pide al backend (backend/, npm start) que cree el cobro y
// que lo verifique. El Access Token de Mercado Pago solo vive en el backend.
// Cada petición lleva el token de sesión de Firebase: el backend comprueba
// quién es el conductor y que el viaje sea suyo.
import { auth } from '../config/firebase';
import { API } from '../config/api';
import { PaymentError, isValidCheckoutUrl } from '../utils/paymentRequest';

async function postToBackend(path, body) {
  if (!API.baseUrl) throw new PaymentError('config', 'Falta EXPO_PUBLIC_API_URL');
  const user = auth.currentUser;
  if (!user) throw new PaymentError('session', 'Sin sesión');
  const idToken = await user.getIdToken();

  // Límite de tiempo con AbortController (funciona en React Native).
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API.requestTimeoutMs);
  let response;
  try {
    response = await fetch(`${API.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new PaymentError('network', 'Sin respuesta del servidor de pagos');
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) throw new PaymentError(response.status, data?.error ?? 'Error del servidor de pagos');
  return data;
}

// Crea el cobro del viaje y devuelve el enlace del checkout de Mercado Pago.
export async function startMercadoPagoPayment(tripId) {
  const data = await postToBackend('/api/payments/start', { tripId });
  if (!isValidCheckoutUrl(data?.checkoutUrl)) throw new PaymentError('invalid', 'Enlace de pago inválido');
  return data.checkoutUrl;
}

// Pregunta (a través del backend) cómo va el pago. Si está aprobado, el
// backend ya marcó el viaje como pagado y la pantalla cambia sola.
export async function verifyMercadoPagoPayment(tripId) {
  const data = await postToBackend('/api/payments/verify', { tripId });
  return typeof data?.paymentStatus === 'string' ? data.paymentStatus : null;
}
