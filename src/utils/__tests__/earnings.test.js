// src/utils/__tests__/earnings.test.js
import {
  getPeriodRange,
  getCustomRange,
  filterTrips,
  summarizeEarnings,
  calculateBalance,
} from '../earnings';

// Jueves 12 de noviembre de 2026, 20:30 (hora del celular).
const NOW = new Date(2026, 10, 12, 20, 30);

// Viaje ya revisado (como lo deja parseFinishedTrip). Montos reales de las pruebas.
const trip = (overrides = {}) => ({
  id: 't',
  status: 'paid',
  paymentMethod: 'mercadopago',
  paymentStatus: 'approved',
  fare: 14700,
  commission: 2940,
  driverEarnings: 11760,
  tip: 0,
  completedAtMs: new Date(2026, 10, 12, 19, 0).getTime(),
  ...overrides,
});

describe('getPeriodRange', () => {
  test('hoy: desde las 00:00 hasta las 00:00 del día siguiente', () => {
    expect(getPeriodRange('today', NOW)).toEqual({
      start: new Date(2026, 10, 12),
      end: new Date(2026, 10, 13),
    });
  });

  test('semana: de lunes a domingo (el 12/11/2026 es jueves → lunes 9)', () => {
    expect(getPeriodRange('week', NOW)).toEqual({
      start: new Date(2026, 10, 9),
      end: new Date(2026, 10, 16),
    });
  });

  test('semana un domingo: empieza el lunes anterior, no el siguiente', () => {
    const sunday = new Date(2026, 10, 15, 10, 0);
    expect(getPeriodRange('week', sunday).start).toEqual(new Date(2026, 10, 9));
  });

  test('mes: del día 1 al día 1 del mes siguiente (diciembre pasa a enero)', () => {
    expect(getPeriodRange('month', NOW)).toEqual({
      start: new Date(2026, 10, 1),
      end: new Date(2026, 11, 1),
    });
    expect(getPeriodRange('month', new Date(2026, 11, 20)).end).toEqual(new Date(2027, 0, 1));
  });

  test('periodo desconocido: null', () => {
    expect(getPeriodRange('year', NOW)).toBeNull();
  });
});

describe('getCustomRange', () => {
  test('incluye los dos días completos', () => {
    expect(getCustomRange(new Date(2026, 10, 1, 15, 0), new Date(2026, 10, 5, 8, 0))).toEqual({
      start: new Date(2026, 10, 1),
      end: new Date(2026, 10, 6),
    });
  });

  test('un solo día (Desde = Hasta): válido', () => {
    expect(getCustomRange(NOW, NOW)).toEqual({ start: new Date(2026, 10, 12), end: new Date(2026, 10, 13) });
  });

  test('Desde después de Hasta, o sin fecha: null', () => {
    expect(getCustomRange(new Date(2026, 10, 5), new Date(2026, 10, 1))).toBeNull();
    expect(getCustomRange(null, NOW)).toBeNull();
  });
});

describe('filterTrips', () => {
  const trips = [
    trip({ id: 'oct', completedAtMs: new Date(2026, 9, 30, 10, 0).getTime() }),
    trip({ id: 'hoy-efectivo', paymentMethod: 'cash', completedAtMs: new Date(2026, 10, 12, 18, 0).getTime() }),
    trip({ id: 'hoy-mp', completedAtMs: new Date(2026, 10, 12, 19, 0).getTime() }),
    trip({ id: 'medianoche', completedAtMs: new Date(2026, 10, 13, 0, 0).getTime() }),
  ];

  test('sin filtros: todos, del más reciente al más antiguo', () => {
    expect(filterTrips(trips).map((t) => t.id)).toEqual(['medianoche', 'hoy-mp', 'hoy-efectivo', 'oct']);
  });

  test('hoy: no incluye el viaje de las 00:00 del día siguiente', () => {
    const range = getPeriodRange('today', NOW);
    expect(filterTrips(trips, { range }).map((t) => t.id)).toEqual(['hoy-mp', 'hoy-efectivo']);
  });

  test('por método de pago', () => {
    expect(filterTrips(trips, { paymentMethod: 'cash' }).map((t) => t.id)).toEqual(['hoy-efectivo']);
  });

  test('ningún viaje en el filtro: lista vacía', () => {
    expect(filterTrips([], { paymentMethod: 'cash' })).toEqual([]);
  });

  test('no cambia la lista original', () => {
    const copy = [...trips];
    filterTrips(trips);
    expect(trips).toEqual(copy);
  });
});

describe('summarizeEarnings', () => {
  test('solo cuenta los pagados; los pendientes van aparte', () => {
    const result = summarizeEarnings([
      trip(), // MP 14.700
      trip({ paymentMethod: 'cash', paymentStatus: 'cash', fare: 12000, commission: 2400, driverEarnings: 9600 }),
      trip({ status: 'completed', paymentStatus: 'rejected', fare: 15500, commission: 3100, driverEarnings: 12400 }),
    ]);
    expect(result).toEqual({
      tripCount: 2,
      totalFare: 26700,
      totalCommission: 5340,
      totalTips: 0,
      netEarnings: 21360,
      averagePerTrip: 10680,
      pending: { tripCount: 1, amount: 15500 },
    });
  });

  test('promedio redondeado a pesos enteros', () => {
    const result = summarizeEarnings([trip({ driverEarnings: 100 }), trip({ driverEarnings: 101 }), trip({ driverEarnings: 101 })]);
    expect(result.averagePerTrip).toBe(101); // 302 / 3 = 100,67
  });

  test('sin viajes: todo en 0 (sin dividir por 0)', () => {
    expect(summarizeEarnings([])).toEqual({
      tripCount: 0,
      totalFare: 0,
      totalCommission: 0,
      totalTips: 0,
      netEarnings: 0,
      averagePerTrip: 0,
      pending: { tripCount: 0, amount: 0 },
    });
  });
});

describe('calculateBalance', () => {
  test('Mercado Pago suma la ganancia; efectivo resta la comisión (T9)', () => {
    const balance = calculateBalance([
      trip(), // +11.760
      trip({ paymentMethod: 'cash', paymentStatus: 'cash', fare: 12000, commission: 2400, driverEarnings: 9600 }), // -2.400
    ]);
    expect(balance).toBe(9360);
  });

  test('solo efectivo: saldo negativo (G11)', () => {
    expect(calculateBalance([trip({ paymentMethod: 'cash', paymentStatus: 'cash', commission: 2400 })])).toBe(-2400);
  });

  test('los viajes sin pagar no cambian el saldo', () => {
    expect(calculateBalance([trip({ status: 'completed', paymentStatus: null })])).toBe(0);
  });
});
