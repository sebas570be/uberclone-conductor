// src/i18n/translate.js
// Traducción de textos (enunciado: idioma español / inglés). Función pura,
// sin librerías: busca la clave ('drawer.history') en el diccionario del
// idioma; si falta, usa el español; si tampoco está, devuelve la clave (así
// se nota en pantalla qué texto falta). {nombre} se reemplaza por params.nombre.
// AI-assisted: see docs/AI_LOG.md #18
import es from './es';
import en from './en';

export const DICTIONARIES = Object.freeze({ es, en });
export const DEFAULT_LANGUAGE = 'es';

// Nombre de cada idioma escrito en ese mismo idioma (así se reconoce siempre).
export const LANGUAGE_NAMES = Object.freeze({ es: 'Español', en: 'English' });

export const isSupportedLanguage = (language) => Object.prototype.hasOwnProperty.call(DICTIONARIES, language);

const lookup = (dictionary, key) => key.split('.').reduce((value, part) => value?.[part], dictionary);

export function translate(dictionaries, language, key, params = {}) {
  const text = lookup(dictionaries[language], key) ?? lookup(dictionaries[DEFAULT_LANGUAGE], key);
  if (typeof text !== 'string') return key;
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
}
