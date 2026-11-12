// backend/test/payment.test.js
// Pruebas con el corredor de pruebas que trae Node (node --test): no hay que
// instalar nada. Se ejecutan con: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { summarizePayments, pickCheckoutUrl } = require('../src/utils/payment');

test('sin pagos: null (el pasajero todavía no paga)', () => {
  assert.equal(summarizePayments([], 18800, 'COP'), null);
  assert.equal(summarizePayments(undefined, 18800, 'COP'), null);
});

test('pago aprobado por el monto correcto: approved', () => {
  const result = summarizePayments([{ id: 123, status: 'approved', transaction_amount: 18800, currency_id: 'COP' }], 18800, 'COP');
  assert.deepEqual(result, { paymentStatus: 'approved', paymentId: '123' });
});

test('pago aprobado por OTRO monto: no cuenta como aprobado', () => {
  const result = summarizePayments([{ id: 7, status: 'approved', transaction_amount: 100, currency_id: 'COP' }], 18800, 'COP');
  assert.equal(result.paymentStatus, 'rejected');
});

test('pago en proceso: pending', () => {
  const result = summarizePayments([{ id: 9, status: 'in_process', transaction_amount: 18800, currency_id: 'COP' }], 18800, 'COP');
  assert.deepEqual(result, { paymentStatus: 'pending', paymentId: '9' });
});

test('uno rechazado y luego otro aprobado: approved', () => {
  const result = summarizePayments(
    [
      { id: 2, status: 'approved', transaction_amount: 18800, currency_id: 'COP' },
      { id: 1, status: 'rejected', transaction_amount: 18800, currency_id: 'COP' },
    ],
    18800,
    'COP'
  );
  assert.equal(result.paymentStatus, 'approved');
  assert.equal(result.paymentId, '2');
});

test('todos rechazados: rejected con el más reciente', () => {
  const result = summarizePayments([{ id: 5, status: 'rejected' }, { id: 4, status: 'cancelled' }], 18800, 'COP');
  assert.deepEqual(result, { paymentStatus: 'rejected', paymentId: '5' });
});

test('aprobado por OTRO monto y otro en proceso: pending, no aprobado', () => {
  const result = summarizePayments(
    [
      { id: 11, status: 'approved', transaction_amount: 100, currency_id: 'COP' },
      { id: 10, status: 'in_process', transaction_amount: 18800, currency_id: 'COP' },
    ],
    18800,
    'COP'
  );
  assert.deepEqual(result, { paymentStatus: 'pending', paymentId: '10' });
});

test('enlace de pago: siempre init_point', () => {
  const preference = { init_point: 'https://www.mercadopago.com.co/a', sandbox_init_point: 'https://sandbox.mercadopago.com.co/b' };
  assert.equal(pickCheckoutUrl(preference), 'https://www.mercadopago.com.co/a');
});

test('enlace de pago inválido: error', () => {
  assert.throws(() => pickCheckoutUrl({}));
  assert.throws(() => pickCheckoutUrl({ sandbox_init_point: 'https://sandbox.mercadopago.com.co/b' }));
  assert.throws(() => pickCheckoutUrl({ init_point: 'http://inseguro' }));
});
