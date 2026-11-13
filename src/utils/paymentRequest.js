// src/utils/paymentRequest.js
// Funciones puras del cobro con Mercado Pago: sin red ni Firebase, se prueban
// con Jest.

// Error del cobro con un "tipo" para elegir el mensaje (paymentErrorKey en
// src/i18n/labels.js, en el idioma del conductor): 'config' (falta la
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
