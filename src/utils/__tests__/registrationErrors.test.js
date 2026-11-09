// src/utils/__tests__/registrationErrors.test.js
import { getPersonalDataErrors, getVehicleErrors, hasErrors } from '../registrationErrors';

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

const VALID_VEHICLE = {
  category: 'economy',
  plate: 'ABC123',
  brand: 'Chevrolet',
  model: 'Spark',
  year: '2020',
  color: 'white',
  capacity: '4',
};

describe('getVehicleErrors', () => {
  test('datos válidos: no hay errores', () => {
    expect(getVehicleErrors(VALID_VEHICLE, TODAY)).toEqual({});
  });

  test('formulario vacío: hay un error en cada campo', () => {
    const empty = { category: '', plate: '', brand: '', model: '', year: '', color: '', capacity: '' };
    expect(Object.keys(getVehicleErrors(empty, TODAY)).sort()).toEqual(
      ['brand', 'capacity', 'category', 'color', 'model', 'plate', 'year'].sort()
    );
  });

  test('cambiar a XL con capacidad 4: aparece el error de capacidad sin borrarla', () => {
    const errors = getVehicleErrors({ ...VALID_VEHICLE, category: 'xl' }, TODAY);
    expect(errors.capacity).toBe('Escribe la capacidad: mínimo 6 pasajeros para XL.');
  });

  test('sin categoría: la capacidad pide elegir primero la categoría', () => {
    const errors = getVehicleErrors({ ...VALID_VEHICLE, category: '' }, TODAY);
    expect(errors.capacity).toBe('Elige primero la categoría para saber la capacidad mínima.');
  });
});
