// src/utils/paymentRequest.js
// Funciones puras del cobro con Mercado Pago: sin red ni Firebase, se prueban
// con Jest.

// Error del cobro con un "tipo" para elegir el mensaje: 'config' (falta la
// URL del backend), 'session' (sin sesión), 'network' (sin conexión o sin
// respuesta), 'invalid' (respuesta inesperada) o el código HTTP del backend.
export class PaymentError extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind;
  }
}

// El enlace del checkout se abre en el navegador: solo se acepta si es https
// y de Mercado Pago Colombia o su dominio general (mercadopago.com.co o
// mercadopago.com, con o sin subdominio como www). Así, aunque el backend
// devolviera otra cosa, la app no abre un sitio ajeno.
export function isValidCheckoutUrl(url) {
  return typeof url === 'string' && /^https:\/\/([a-z0-9-]+\.)*mercadopago\.com(\.co)?\//.test(url);
}

// Mensaje para el conductor según el error.
export function getPaymentErrorMessage(error) {
  switch (error?.kind) {
    case 'config':
      return 'Falta configurar el servidor de pagos (EXPO_PUBLIC_API_URL en el .env).';
    case 'session':
    case 401:
      return 'Tu sesión venció. Cierra sesión y vuelve a entrar.';
    case 'network':
      return 'No se pudo conectar con el servidor de pagos. Revisa que esté encendido y en la misma red.';
    case 409:
      return 'Este viaje ya no se puede cobrar (puede que ya esté pagado).';
    case 502:
      return 'Mercado Pago no respondió. Inténtalo de nuevo.';
    default:
      return 'No se pudo completar el cobro. Inténtalo de nuevo.';
  }
}

// Mensaje después de verificar, según el estado que devolvió el backend.
// approved no necesita mensaje: la pantalla cambia sola a "Viaje pagado".
export function getVerifyMessage(paymentStatus) {
  if (paymentStatus === 'rejected') return 'El pago fue rechazado. Puedes intentarlo de nuevo.';
  if (paymentStatus === 'pending') return 'El pago todavía no está aprobado. Toca "Verificar pago" en un momento.';
  return '';
}
