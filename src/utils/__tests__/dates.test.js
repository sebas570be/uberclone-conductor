// src/utils/__tests__/dates.test.js
import { formatDate, yearsAgo } from '../dates';

test('formatDate muestra día/mes/año con dos dígitos', () => {
  expect(formatDate(new Date(2026, 10, 6))).toBe('06/11/2026');
});

test('yearsAgo devuelve la misma fecha N años antes', () => {
  expect(formatDate(yearsAgo(18, new Date(2026, 10, 6)))).toBe('06/11/2008');
});
