// src/utils/__tests__/tripCompletion.test.js
import { buildCompletionData } from '../tripCompletion';

describe('buildCompletionData', () => {
  test('ejemplo del enunciado: 8,5 km / 22 min económico', () => {
    expect(buildCompletionData({ distanceKm: 8.5, durationMin: 22, category: 'economy' })).toEqual({
      status: 'completed',
      fare: 19200,
      commission: 3840,
      tip: 0,
      driverEarnings: 15360,
      commissionRate: 0.2,
    });
  });

  test('ejemplo del enunciado en XL: 26.900 / 5.380 / 21.520', () => {
    const data = buildCompletionData({ distanceKm: 8.5, durationMin: 22, category: 'xl' });
    expect([data.fare, data.commission, data.driverEarnings]).toEqual([26900, 5380, 21520]);
  });

  test('cumple lo que exigen las reglas: comisión x 5 = tarifa y ganancia = tarifa - comisión', () => {
    [
      { distanceKm: 5.4, durationMin: 10, category: 'economy' },
      { distanceKm: 6.2, durationMin: 14, category: 'premium' },
      { distanceKm: 0.3, durationMin: 1, category: 'xl' }, // tarifa mínima
    ].forEach((trip) => {
      const data = buildCompletionData(trip);
      expect(data.commission * 5).toBe(data.fare);
      expect(data.driverEarnings).toBe(data.fare - data.commission);
      expect(data.fare % 100).toBe(0);
    });
  });

  test('viaje corto: se cobra la tarifa mínima (6.000)', () => {
    expect(buildCompletionData({ distanceKm: 0.3, durationMin: 1, category: 'economy' }).fare).toBe(6000);
  });
});
