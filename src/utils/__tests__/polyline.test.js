// src/utils/__tests__/polyline.test.js
import { decodePolyline } from '../polyline';

describe('decodePolyline', () => {
  test('ejemplo oficial del formato: 3 puntos', () => {
    expect(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@')).toEqual([
      { latitude: 38.5, longitude: -120.2 },
      { latitude: 40.7, longitude: -120.95 },
      { latitude: 43.252, longitude: -126.453 },
    ]);
  });

  test('un solo punto', () => {
    expect(decodePolyline('_p~iF~ps|U')).toEqual([{ latitude: 38.5, longitude: -120.2 }]);
  });

  test('vacío o que no es texto: lista vacía', () => {
    expect(decodePolyline('')).toEqual([]);
    expect(decodePolyline(null)).toEqual([]);
    expect(decodePolyline(undefined)).toEqual([]);
  });

  test('cortado a la mitad: lista vacía (no rompe el mapa)', () => {
    expect(decodePolyline('_p~iF~ps|U_ulL')).toEqual([]);
  });
});
