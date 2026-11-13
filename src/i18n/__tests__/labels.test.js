// src/i18n/__tests__/labels.test.js
import { optionLabel, paymentMethodText, paymentStatusText, historyStatusText } from '../labels';
import { translate, DICTIONARIES } from '../translate';

// Un t de verdad para cada idioma (igual que el del LanguageContext).
const tFor = (language) => (key, params) => translate(DICTIONARIES, language, key, params);
const es = tFor('es');
const en = tFor('en');

describe('labels', () => {
  test('códigos de las listas en los dos idiomas; sin valor: vacío', () => {
    expect(optionLabel(es, 'color', 'gray')).toBe('Gris');
    expect(optionLabel(en, 'color', 'gray')).toBe('Gray');
    expect(optionLabel(en, 'gender', 'undisclosed')).toBe('Prefer not to say');
    expect(optionLabel(es, 'category', 'economy')).toBe('Económico');
    expect(optionLabel(es, 'color', null)).toBe('');
  });

  test('método y estado del pago; sin estado: Pendiente', () => {
    expect(paymentMethodText(es, 'cash')).toBe('Efectivo');
    expect(paymentMethodText(en, 'cash')).toBe('Cash');
    expect(paymentStatusText(es, 'approved')).toBe('Aprobado');
    expect(paymentStatusText(en, null)).toBe('Pending');
  });

  test('historial: sin pagar dice "Pendiente de pago"; pagado, cómo se pagó', () => {
    expect(historyStatusText(es, { status: 'completed', paymentStatus: 'rejected' })).toBe('Pendiente de pago');
    expect(historyStatusText(en, { status: 'completed', paymentStatus: null })).toBe('Payment pending');
    expect(historyStatusText(es, { status: 'paid', paymentStatus: 'cash' })).toBe('Efectivo');
  });
});
