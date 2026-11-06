// src/utils/__tests__/registrationValidators.test.js
// Pruebas de las validaciones del registro. Las de fechas reciben "today" fijo
// para que el resultado no cambie según el día en que se ejecuten.
import {
  isValidFullName,
  isValidDocumentNumber,
  isValidPhone,
  getAge,
  isAdult,
  normalizePlate,
  isValidPlate,
  isValidBrandOrModel,
  isValidVehicleYear,
  isValidCapacity,
  isFutureDate,
  requiresTechnicalReview,
} from '../validators';

// Meses en JavaScript van de 0 a 11: new Date(2026, 10, 6) es 6 de noviembre.
const TODAY = new Date(2026, 10, 6);

describe('isValidFullName', () => {
  test('acepta letras con tildes, ñ y espacios', () => {
    expect(isValidFullName('José Peña Úsuga')).toBe(true);
  });

  test('rechaza vacío, solo espacios, números, símbolos y más de 50 letras', () => {
    expect(isValidFullName('')).toBe(false);
    expect(isValidFullName('   ')).toBe(false);
    expect(isValidFullName('Juan 2')).toBe(false);
    expect(isValidFullName('Juan-Pérez')).toBe(false);
    expect(isValidFullName('a'.repeat(51))).toBe(false);
  });
});

describe('isValidDocumentNumber e isValidPhone', () => {
  test('documento: de 6 a 10 dígitos', () => {
    expect(isValidDocumentNumber('123456')).toBe(true);
    expect(isValidDocumentNumber('1234567890')).toBe(true);
    expect(isValidDocumentNumber('12345')).toBe(false);
    expect(isValidDocumentNumber('12345678901')).toBe(false);
    expect(isValidDocumentNumber('12.345.678')).toBe(false);
  });

  test('celular: exactamente 10 dígitos', () => {
    expect(isValidPhone('3001234567')).toBe(true);
    expect(isValidPhone('300123456')).toBe(false);
    expect(isValidPhone('300 123 4567')).toBe(false);
  });
});

describe('getAge e isAdult', () => {
  test('cumple 18 justo hoy: es mayor de edad', () => {
    expect(getAge(new Date(2008, 10, 6), TODAY)).toBe(18);
    expect(isAdult(new Date(2008, 10, 6), TODAY)).toBe(true);
  });

  test('cumple 18 mañana: todavía tiene 17', () => {
    expect(getAge(new Date(2008, 10, 7), TODAY)).toBe(17);
    expect(isAdult(new Date(2008, 10, 7), TODAY)).toBe(false);
  });

  test('rechaza una fecha inválida o vacía', () => {
    expect(isAdult(new Date('no es fecha'), TODAY)).toBe(false);
    expect(isAdult(null, TODAY)).toBe(false);
  });
});

describe('placa', () => {
  test('se convierte a mayúsculas antes de validar', () => {
    expect(normalizePlate(' abc123 ')).toBe('ABC123');
    expect(isValidPlate(normalizePlate('abc123'))).toBe(true);
  });

  test('rechaza minúsculas sin convertir y formatos distintos', () => {
    expect(isValidPlate('abc123')).toBe(false);
    expect(isValidPlate('AB1234')).toBe(false);
    expect(isValidPlate('ABC12')).toBe(false);
  });
});

describe('marca, modelo y año', () => {
  test('marca o modelo: no vacío y máximo 30', () => {
    expect(isValidBrandOrModel('Chevrolet')).toBe(true);
    expect(isValidBrandOrModel('  ')).toBe(false);
    expect(isValidBrandOrModel('a'.repeat(31))).toBe(false);
  });

  test('año: 4 dígitos, desde 2000 y no mayor al año actual', () => {
    expect(isValidVehicleYear('2026', TODAY)).toBe(true);
    expect(isValidVehicleYear('2000', TODAY)).toBe(true);
    expect(isValidVehicleYear('2027', TODAY)).toBe(false);
    expect(isValidVehicleYear('1999', TODAY)).toBe(false);
    expect(isValidVehicleYear('26', TODAY)).toBe(false);
  });
});

describe('isValidCapacity', () => {
  test('XL exige mínimo 6', () => {
    expect(isValidCapacity('6', 'xl')).toBe(true);
    expect(isValidCapacity('5', 'xl')).toBe(false);
  });

  test('Económico y Premium exigen mínimo 4', () => {
    expect(isValidCapacity('4', 'economy')).toBe(true);
    expect(isValidCapacity('3', 'premium')).toBe(false);
  });

  test('rechaza una categoría desconocida o un valor no numérico', () => {
    expect(isValidCapacity('6', 'moto')).toBe(false);
    expect(isValidCapacity('seis', 'xl')).toBe(false);
  });
});

describe('isFutureDate', () => {
  test('mañana está vigente; hoy y ayer no', () => {
    expect(isFutureDate(new Date(2026, 10, 7), TODAY)).toBe(true);
    expect(isFutureDate(new Date(2026, 10, 6, 23, 59), TODAY)).toBe(false);
    expect(isFutureDate(new Date(2026, 10, 5), TODAY)).toBe(false);
  });
});

describe('requiresTechnicalReview', () => {
  test('obligatoria desde los 5 años del vehículo', () => {
    expect(requiresTechnicalReview('2021', TODAY)).toBe(true);
    expect(requiresTechnicalReview('2022', TODAY)).toBe(false);
  });

  test('si el año es inválido no la exige (el error lo marca el campo Año)', () => {
    expect(requiresTechnicalReview('', TODAY)).toBe(false);
  });
});
