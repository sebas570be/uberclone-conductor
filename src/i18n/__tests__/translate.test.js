// src/i18n/__tests__/translate.test.js
import { translate, isSupportedLanguage, DICTIONARIES } from '../translate';

const TEST_DICTIONARIES = {
  es: { greeting: { hello: 'Hola, {name}' }, onlySpanish: 'Solo en español' },
  en: { greeting: { hello: 'Hello, {name}' } },
};

// Todas las rutas 'a.b' de un diccionario.
const keysOf = (object, prefix = '') =>
  Object.entries(object).flatMap(([key, value]) =>
    typeof value === 'object' ? keysOf(value, `${prefix}${key}.`) : [`${prefix}${key}`]
  );

describe('translate', () => {
  test('busca la clave en el idioma elegido y reemplaza {name}', () => {
    expect(translate(TEST_DICTIONARIES, 'es', 'greeting.hello', { name: 'Fray' })).toBe('Hola, Fray');
    expect(translate(TEST_DICTIONARIES, 'en', 'greeting.hello', { name: 'Fray' })).toBe('Hello, Fray');
  });

  test('si falta en inglés, usa el español', () => {
    expect(translate(TEST_DICTIONARIES, 'en', 'onlySpanish')).toBe('Solo en español');
  });

  test('clave inexistente o que no es texto: devuelve la clave', () => {
    expect(translate(TEST_DICTIONARIES, 'es', 'nothing.here')).toBe('nothing.here');
    expect(translate(TEST_DICTIONARIES, 'es', 'greeting')).toBe('greeting');
  });

  test('sin el parámetro, deja {name} como está', () => {
    expect(translate(TEST_DICTIONARIES, 'es', 'greeting.hello')).toBe('Hola, {name}');
  });
});

describe('diccionarios de la app', () => {
  test('en.js tiene exactamente las mismas claves que es.js', () => {
    expect(keysOf(DICTIONARIES.en).sort()).toEqual(keysOf(DICTIONARIES.es).sort());
  });

  test('idiomas soportados: es y en', () => {
    expect(isSupportedLanguage('es')).toBe(true);
    expect(isSupportedLanguage('en')).toBe(true);
    expect(isSupportedLanguage('fr')).toBe(false);
    expect(isSupportedLanguage(undefined)).toBe(false);
  });
});
