// src/utils/__tests__/locationDocument.test.js
import { buildLocationDocument, isLocationStale } from '../locationDocument';

const COORDS = { latitude: 4.711, longitude: -74.0721, accuracy: 12 };

describe('buildLocationDocument', () => {
  test('disponible: guarda solo latitud y longitud', () => {
    expect(buildLocationDocument(true, COORDS)).toEqual({
      isAvailable: true,
      location: { latitude: 4.711, longitude: -74.0721 },
    });
  });

  test('no disponible: la ubicación se borra aunque haya coordenadas', () => {
    expect(buildLocationDocument(false, COORDS)).toEqual({ isAvailable: false, location: null });
  });

  test('disponible pero sin GPS todavía: no se marca disponible', () => {
    expect(buildLocationDocument(true, null)).toEqual({ isAvailable: false, location: null });
  });
});

describe('isLocationStale', () => {
  const NOW = new Date(2026, 10, 10, 22, 0, 0);

  test('actualizada hace 10 s: vigente', () => {
    expect(isLocationStale(new Date(NOW.getTime() - 10000), NOW)).toBe(false);
  });

  test('actualizada hace 31 s o sin fecha: desconectado', () => {
    expect(isLocationStale(new Date(NOW.getTime() - 31000), NOW)).toBe(true);
    expect(isLocationStale(null, NOW)).toBe(true);
  });
});
