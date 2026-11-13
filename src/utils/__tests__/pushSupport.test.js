// src/utils/__tests__/pushSupport.test.js
import { isPushSupported } from '../pushSupport';

describe('isPushSupported', () => {
  test('APK de Android (standalone o bare): sí', () => {
    expect(isPushSupported('android', 'standalone')).toBe(true);
    expect(isPushSupported('android', 'bare')).toBe(true);
  });

  test('Expo Go en Android: no (desde SDK 53 no recibe push)', () => {
    expect(isPushSupported('android', 'storeClient')).toBe(false);
  });

  test('iPhone: no (exige cuenta Apple Developer de pago)', () => {
    expect(isPushSupported('ios', 'standalone')).toBe(false);
    expect(isPushSupported('ios', 'storeClient')).toBe(false);
  });
});
