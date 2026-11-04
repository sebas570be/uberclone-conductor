// src/utils/__tests__/calculateFare.test.js
// Pruebas unitarias de calculateFare con el ejemplo de la sección 5 del enunciado
// (viaje de 8,5 km y 22 minutos, sin propina) y con los datos inválidos que se
// encontraron en la revisión (textos que JavaScript convertía o concatenaba).
import { calculateFare } from '../calculateFare';

describe('calculateFare', () => {
  test('Económico: 8,5 km y 22 min da 19.200 / 3.840 / 15.360', () => {
    const result = calculateFare({ distanceKm: 8.5, durationMin: 22, category: 'economy' });
    expect(result).toMatchObject({ fare: 19200, commission: 3840, driverEarnings: 15360 });
  });

  test('XL: 8,5 km y 22 min da 26.900 / 5.380 / 21.520', () => {
    const result = calculateFare({ distanceKm: 8.5, durationMin: 22, category: 'xl' });
    expect(result).toMatchObject({ fare: 26900, commission: 5380, driverEarnings: 21520 });
  });

  test('rechaza una distancia en texto', () => {
    expect(() => calculateFare({ distanceKm: '5', durationMin: 22, category: 'economy' })).toThrow();
  });

  test('rechaza una propina en texto', () => {
    expect(() =>
      calculateFare({ distanceKm: 8.5, durationMin: 22, category: 'economy', tip: '1000' })
    ).toThrow();
  });
});
