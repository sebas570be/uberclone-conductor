// src/utils/__tests__/validators.test.js
import { isValidEmail } from '../validators';

describe('isValidEmail', () => {
  test('acepta un correo con @, dominio y extensión', () => {
    expect(isValidEmail('conductor@gmail.com')).toBe(true);
  });

  test('ignora los espacios al inicio y al final', () => {
    expect(isValidEmail('  conductor@gmail.com  ')).toBe(true);
  });

  test('rechaza correos sin @, sin dominio o sin extensión', () => {
    expect(isValidEmail('conductorgmail.com')).toBe(false);
    expect(isValidEmail('conductor@')).toBe(false);
    expect(isValidEmail('conductor@gmail')).toBe(false);
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
  });
});
