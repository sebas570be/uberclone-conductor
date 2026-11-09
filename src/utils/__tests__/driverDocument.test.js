// src/utils/__tests__/driverDocument.test.js
import { buildDriverDocument } from '../driverDocument';

const TODAY = new Date(2026, 10, 6);

const FORM = {
  fullName: '  José Peña  ',
  documentNumber: '1234567890',
  phone: '3001234567',
  birthDate: new Date(2000, 0, 15),
  gender: 'male',
  language: 'es',
  category: 'xl',
  plate: 'ABC123',
  brand: ' Kia ',
  model: 'Niro',
  year: '2024',
  color: 'black',
  capacity: '6',
  licenseNumber: '1234567890',
  licenseExpiry: new Date(2030, 0, 1),
  soatExpiry: new Date(2027, 5, 1),
  technicalReviewExpiry: new Date(2027, 0, 1),
  mercadoPagoEmail: ' Conductor@Gmail.com ',
  termsAccepted: true,
};

describe('buildDriverDocument', () => {
  const driver = buildDriverDocument(FORM, 'prueba2@gmail.com', TODAY);

  test('siempre se crea en estado pending', () => {
    expect(driver.status).toBe('pending');
  });

  test('año y capacidad se guardan como números', () => {
    expect(driver.vehicle.year).toBe(2024);
    expect(driver.vehicle.capacity).toBe(6);
  });

  test('limpia espacios y pasa el correo de Mercado Pago a minúsculas', () => {
    expect(driver.personal.fullName).toBe('José Peña');
    expect(driver.vehicle.brand).toBe('Kia');
    expect(driver.payments.mercadoPagoEmail).toBe('conductor@gmail.com');
  });

  test('vehículo de menos de 5 años: la revisión técnico-mecánica se guarda como null', () => {
    expect(driver.documents.technicalReviewExpiry).toBeNull();
  });

  test('guarda la comisión aceptada y no guarda datos bancarios', () => {
    expect(driver.terms.commissionRate).toBe(0.2);
    expect(Object.keys(driver.payments)).toEqual(['mercadoPagoEmail']);
  });
});
