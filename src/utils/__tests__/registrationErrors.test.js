// src/utils/__tests__/registrationErrors.test.js
import { getPersonalDataErrors, hasErrors } from '../registrationErrors';

const TODAY = new Date(2026, 10, 6); // 6 de noviembre de 2026

const VALID_PERSONAL_DATA = {
  fullName: 'José Peña',
  documentNumber: '1234567890',
  phone: '3001234567',
  birthDate: new Date(2000, 0, 15),
  gender: 'male',
  language: 'es',
};

describe('getPersonalDataErrors', () => {
  test('datos válidos: no hay errores', () => {
    const errors = getPersonalDataErrors(VALID_PERSONAL_DATA, TODAY);
    expect(errors).toEqual({});
    expect(hasErrors(errors)).toBe(false);
  });

  test('formulario vacío: hay un error en cada campo', () => {
    const empty = { fullName: '', documentNumber: '', phone: '', birthDate: null, gender: '', language: '' };
    const errors = getPersonalDataErrors(empty, TODAY);
    expect(Object.keys(errors).sort()).toEqual(
      ['birthDate', 'documentNumber', 'fullName', 'gender', 'language', 'phone'].sort()
    );
  });

  test('menor de edad: el error es de la edad, no de fecha vacía', () => {
    const errors = getPersonalDataErrors({ ...VALID_PERSONAL_DATA, birthDate: new Date(2008, 10, 7) }, TODAY);
    expect(errors.birthDate).toBe('Debes ser mayor de 18 años para registrarte.');
  });

  test('rechaza un género que no está en la lista', () => {
    const errors = getPersonalDataErrors({ ...VALID_PERSONAL_DATA, gender: 'hacker' }, TODAY);
    expect(errors.gender).toBeDefined();
  });
});
