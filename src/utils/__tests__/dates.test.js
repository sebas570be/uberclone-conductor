// src/utils/__tests__/dates.test.js
import { formatDate, formatDateTime, yearsAgo } from '../dates';

test('formatDate muestra día/mes/año con dos dígitos', () => {
  expect(formatDate(new Date(2026, 10, 6))).toBe('06/11/2026');
});

test('yearsAgo devuelve la misma fecha N años antes', () => {
  expect(formatDate(yearsAgo(18, new Date(2026, 10, 6)))).toBe('06/11/2008');
});

test('formatDateTime agrega la hora en formato de 24 horas con dos dígitos', () => {
  expect(formatDateTime(new Date(2026, 10, 12, 19, 5))).toBe('12/11/2026 19:05');
  expect(formatDateTime(new Date(2026, 0, 3, 7, 0))).toBe('03/01/2026 07:00');
});
