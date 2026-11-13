// src/utils/__tests__/paymentRequest.test.js
// Los mensajes del cobro se prueban en src/i18n/__tests__/labels.test.js
// (paymentErrorKey y verifyMessageKey).
import { isValidCheckoutUrl } from '../paymentRequest';

describe('isValidCheckoutUrl', () => {
  test('enlaces https de Mercado Pago: válidos', () => {
    expect(isValidCheckoutUrl('https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=123')).toBe(true);
    expect(isValidCheckoutUrl('https://sandbox.mercadopago.com.co/checkout/v1/redirect?pref_id=1')).toBe(true);
    expect(isValidCheckoutUrl('https://www.mercadopago.com/checkout/v1/redirect?pref_id=1')).toBe(true);
  });

  test('http, otro dominio o dominio que solo se parece: inválidos', () => {
    expect(isValidCheckoutUrl('http://www.mercadopago.com.co/checkout')).toBe(false);
    expect(isValidCheckoutUrl('https://sitio-falso.com/mercadopago.com.co/')).toBe(false);
    expect(isValidCheckoutUrl('https://mercadopago.com.co.sitio-falso.com/')).toBe(false);
    expect(isValidCheckoutUrl('https://falsomercadopago.com.co/')).toBe(false);
    expect(isValidCheckoutUrl('https://mercadopago.com.evil.com/checkout')).toBe(false);
    expect(isValidCheckoutUrl('https://www.mercadopago.com.co@evil.com/')).toBe(false);
  });

  test('Mercado Pago de otro país: inválido (la app cobra en Colombia)', () => {
    expect(isValidCheckoutUrl('https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=1')).toBe(false);
  });

  test('vacío o que no es texto: inválido', () => {
    expect(isValidCheckoutUrl('')).toBe(false);
    expect(isValidCheckoutUrl(undefined)).toBe(false);
    expect(isValidCheckoutUrl(123)).toBe(false);
  });
});
