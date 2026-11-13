// src/utils/__tests__/driverProfile.test.js
import { profileFormFromDriver, buildProfileUpdate, isLocalPhoto } from '../driverProfile';

const TODAY = new Date(2026, 10, 12);

// Firestore entrega las fechas como Timestamp: aquí basta un objeto con toDate().
const timestamp = (date) => ({ toDate: () => date });

const URL = 'https://res.cloudinary.com/demo/';

// Documento de un conductor aprobado, como lo guarda el registro.
const DRIVER = {
  status: 'approved',
  email: 'prueba2@gmail.com',
  language: 'es',
  personal: {
    fullName: 'José Peña',
    documentNumber: '1234567890',
    phone: '3001234567',
    birthDate: timestamp(new Date(2000, 0, 15)),
    gender: 'male',
    photoUrl: `${URL}perfil.jpg`,
  },
  vehicle: {
    category: 'xl',
    plate: 'ABC123',
    brand: 'Kia',
    model: 'Niro',
    year: 2024,
    color: 'black',
    capacity: 6,
    photoUrl: `${URL}vehiculo.jpg`,
  },
  documents: {
    licenseNumber: '1234567890',
    licenseExpiry: timestamp(new Date(2030, 0, 1)),
    licensePhotoUrl: `${URL}licencia.jpg`,
    soatExpiry: timestamp(new Date(2027, 5, 1)),
    soatPhotoUrl: `${URL}soat.jpg`,
    technicalReviewExpiry: null,
    technicalReviewPhotoUrl: null,
  },
  payments: { mercadoPagoEmail: 'conductor@gmail.com' },
  terms: { accepted: true, commissionRate: 0.2 },
};

const form = (overrides = {}) => ({ ...profileFormFromDriver(DRIVER), ...overrides });

describe('profileFormFromDriver', () => {
  test('fechas como Date, año y capacidad como texto, fotos con su URL', () => {
    const result = profileFormFromDriver(DRIVER);
    expect(result.birthDate).toEqual(new Date(2000, 0, 15));
    expect(result.soatExpiry).toEqual(new Date(2027, 5, 1));
    expect(result.technicalReviewExpiry).toBeNull();
    expect(result.year).toBe('2024');
    expect(result.capacity).toBe('6');
    expect(result.profilePhoto).toBe(`${URL}perfil.jpg`);
    expect(result.termsAccepted).toBe(true);
  });
});

describe('buildProfileUpdate', () => {
  test('sin cambios: ningún campo cambia y sigue aprobado', () => {
    const result = buildProfileUpdate(DRIVER, form(), undefined, TODAY);
    expect(result.changedFields).toEqual([]);
    expect(result.needsReview).toBe(false);
    expect(result.update.status).toBe('approved');
  });

  test('celular, correo de Mercado Pago e idioma: se guardan directo (sigue aprobado)', () => {
    const result = buildProfileUpdate(
      DRIVER,
      form({ phone: '3109876543', mercadoPagoEmail: ' Otro@Gmail.com ', language: 'en' }),
      undefined,
      TODAY
    );
    expect(result.changedFields).toEqual(['language', 'personal.phone', 'payments.mercadoPagoEmail']);
    expect(result.needsReview).toBe(false);
    expect(result.update.status).toBe('approved');
    expect(result.update.payments.mercadoPagoEmail).toBe('otro@gmail.com');
  });

  test('nombre o género: vuelve a pendiente', () => {
    expect(buildProfileUpdate(DRIVER, form({ fullName: 'José Pérez' }), undefined, TODAY).update.status).toBe(
      'pending'
    );
    expect(buildProfileUpdate(DRIVER, form({ gender: 'other' }), undefined, TODAY).needsReview).toBe(true);
  });

  test('foto nueva (uri local): cambia y vuelve a pendiente antes de subirla', () => {
    const result = buildProfileUpdate(DRIVER, form({ profilePhoto: 'file:///foto-nueva.jpg' }), undefined, TODAY);
    expect(result.changedFields).toEqual(['personal.photoUrl']);
    expect(result.needsReview).toBe(true);
  });

  test('vehículo: placa nueva vuelve a pendiente', () => {
    const result = buildProfileUpdate(DRIVER, form({ plate: 'XYZ789' }), undefined, TODAY);
    expect(result.changedFields).toEqual(['vehicle.plate']);
    expect(result.update.status).toBe('pending');
  });

  test('documentos: la misma fecha (Date contra Timestamp) no cuenta como cambio; otra fecha sí', () => {
    expect(buildProfileUpdate(DRIVER, form({ soatExpiry: new Date(2027, 5, 1) }), undefined, TODAY).changedFields).toEqual(
      []
    );
    const result = buildProfileUpdate(DRIVER, form({ soatExpiry: new Date(2028, 5, 1) }), undefined, TODAY);
    expect(result.changedFields).toEqual(['documents.soatExpiry']);
    expect(result.needsReview).toBe(true);
  });

  test('documento de identidad y fecha de nacimiento no se pueden cambiar', () => {
    const result = buildProfileUpdate(
      DRIVER,
      form({ documentNumber: '999999', birthDate: new Date(1990, 0, 1) }),
      undefined,
      TODAY
    );
    expect(result.update.personal.documentNumber).toBe('1234567890');
    expect(result.update.personal.birthDate).toBe(DRIVER.personal.birthDate);
    expect(result.changedFields).toEqual([]);
  });

  test('no toca el correo de la cuenta, los términos ni la fecha de creación', () => {
    const { update } = buildProfileUpdate(DRIVER, form({ phone: '3109876543' }), undefined, TODAY);
    expect(Object.keys(update).sort()).toEqual(['documents', 'language', 'payments', 'personal', 'status', 'vehicle']);
  });

  test('guarda las URL ya subidas, no las rutas del celular', () => {
    const photoUrls = {
      profile: `${URL}perfil-nueva.jpg`,
      vehicle: `${URL}vehiculo.jpg`,
      license: `${URL}licencia.jpg`,
      soat: `${URL}soat.jpg`,
      technicalReview: null,
    };
    const { update } = buildProfileUpdate(DRIVER, form({ profilePhoto: 'file:///foto-nueva.jpg' }), photoUrls, TODAY);
    expect(update.personal.photoUrl).toBe(`${URL}perfil-nueva.jpg`);
  });
});

describe('isLocalPhoto', () => {
  test('uri del celular: sí; URL de Cloudinary o vacío: no', () => {
    expect(isLocalPhoto('file:///foto.jpg')).toBe(true);
    expect(isLocalPhoto(`${URL}perfil.jpg`)).toBe(false);
    expect(isLocalPhoto(null)).toBe(false);
  });
});
