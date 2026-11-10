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

const PHOTO_URLS = {
  profile: 'https://res.cloudinary.com/demo/perfil.jpg',
  vehicle: 'https://res.cloudinary.com/demo/vehiculo.jpg',
  license: 'https://res.cloudinary.com/demo/licencia.jpg',
  soat: 'https://res.cloudinary.com/demo/soat.jpg',
  technicalReview: 'https://res.cloudinary.com/demo/revision.jpg',
};

describe('buildDriverDocument', () => {
  const driver = buildDriverDocument(FORM, 'prueba2@gmail.com', PHOTO_URLS, TODAY);

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

  test('vehículo de menos de 5 años: la revisión técnico-mecánica (fecha y foto) se guarda como null', () => {
    expect(driver.documents.technicalReviewExpiry).toBeNull();
    expect(driver.documents.technicalReviewPhotoUrl).toBeNull();
  });

  test('guarda las URL de Cloudinary, no las rutas del celular', () => {
    expect(driver.personal.photoUrl).toBe(PHOTO_URLS.profile);
    expect(driver.vehicle.photoUrl).toBe(PHOTO_URLS.vehicle);
    expect(driver.documents.licensePhotoUrl).toBe(PHOTO_URLS.license);
    expect(driver.documents.soatPhotoUrl).toBe(PHOTO_URLS.soat);
  });

  test('guarda la comisión aceptada y no guarda datos bancarios', () => {
    expect(driver.terms.commissionRate).toBe(0.2);
    expect(Object.keys(driver.payments)).toEqual(['mercadoPagoEmail']);
  });
});
