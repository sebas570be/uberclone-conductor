// src/utils/__tests__/tripRequestData.test.js
import { parseTripRequest, getSecondsLeft, formatCop, paymentMethodLabel } from '../tripRequestData';

const CREATED_AT = new Date(2026, 10, 11, 0, 30, 0);

// Imita un documento de Firestore: createdAt es un Timestamp con toDate().
const validData = (overrides = {}) => ({
  status: 'requested',
  category: 'economy',
  paymentMethod: 'cash',
  distanceKm: 8.5,
  durationMin: 22,
  origin: { address: 'Calle 50, Itagüí', lat: 6.17, lng: -75.6 },
  destination: { address: 'Calle 41 Sur, Envigado', lat: 6.15, lng: -75.58 },
  createdAt: { toDate: () => CREATED_AT },
  routePolyline: 'abc',
  driverId: 'driver-1',
  ...overrides,
});

describe('parseTripRequest', () => {
  test('documento válido: devuelve solo lo que usa la pantalla, con createdAt en milisegundos', () => {
    expect(parseTripRequest('trip-1', validData())).toEqual({
      id: 'trip-1',
      category: 'economy',
      paymentMethod: 'cash',
      distanceKm: 8.5,
      durationMin: 22,
      origin: { address: 'Calle 50, Itagüí', lat: 6.17, lng: -75.6 },
      destination: { address: 'Calle 41 Sur, Envigado', lat: 6.15, lng: -75.58 },
      createdAtMs: CREATED_AT.getTime(),
    });
  });

  test('distancia 0 o negativa: se descarta', () => {
    expect(parseTripRequest('trip-1', validData({ distanceKm: 0 }))).toBeNull();
    expect(parseTripRequest('trip-1', validData({ distanceKm: -3 }))).toBeNull();
  });

  test('distancia como texto: se descarta (no se confía en los tipos)', () => {
    expect(parseTripRequest('trip-1', validData({ distanceKm: '8.5' }))).toBeNull();
  });

  test('categoría o método de pago desconocidos: se descarta', () => {
    expect(parseTripRequest('trip-1', validData({ category: 'luxury' }))).toBeNull();
    expect(parseTripRequest('trip-1', validData({ category: 'constructor' }))).toBeNull();
    expect(parseTripRequest('trip-1', validData({ paymentMethod: 'nequi' }))).toBeNull();
  });

  test('sin dirección o sin fecha de creación: se descarta', () => {
    expect(parseTripRequest('trip-1', validData({ origin: { address: '', lat: 6, lng: -75 } }))).toBeNull();
    expect(parseTripRequest('trip-1', validData({ createdAt: null }))).toBeNull();
  });

  test('estado distinto de requested: se descarta', () => {
    expect(parseTripRequest('trip-1', validData({ status: 'accepted' }))).toBeNull();
  });
});

describe('getSecondsLeft', () => {
  const start = CREATED_AT.getTime();

  test('recién creada: 15 s', () => {
    expect(getSecondsLeft(start, start)).toBe(15);
  });

  test('llegó 2 s tarde: 13 s', () => {
    expect(getSecondsLeft(start, start + 2000)).toBe(13);
  });

  test('con 0,3 s restantes muestra 1, y al terminar 0', () => {
    expect(getSecondsLeft(start, start + 14700)).toBe(1);
    expect(getSecondsLeft(start, start + 15000)).toBe(0);
  });

  test('vencida hace rato: 0, nunca negativo', () => {
    expect(getSecondsLeft(start, start + 60000)).toBe(0);
  });

  test('reloj del celular atrasado: nunca más de 15 s', () => {
    expect(getSecondsLeft(start, start - 3000)).toBe(15);
  });
});

describe('formatCop', () => {
  test('agrega punto de miles', () => {
    expect(formatCop(19200)).toBe('$ 19.200');
    expect(formatCop(1234567)).toBe('$ 1.234.567');
    expect(formatCop(600)).toBe('$ 600');
  });

  test('negativos (saldo) y redondeo', () => {
    expect(formatCop(-3840)).toBe('-$ 3.840');
    expect(formatCop(15359.6)).toBe('$ 15.360');
  });
});

describe('paymentMethodLabel', () => {
  test('texto para el conductor', () => {
    expect(paymentMethodLabel('cash')).toBe('Efectivo');
    expect(paymentMethodLabel('mercadopago')).toBe('Mercado Pago');
    expect(paymentMethodLabel('otro')).toBe('');
  });
});
