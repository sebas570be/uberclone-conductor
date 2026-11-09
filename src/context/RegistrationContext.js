// src/context/RegistrationContext.js
// Estado compartido del formulario de registro (las 3 pestañas).
// Vive en RegisterTabs: así lo escrito en una pestaña no se pierde al pasar
// a otra, y el botón "Enviar registro" (pestaña 3) puede revisar las tres.
// Cuando el registro se envía, el estado cambia a "pending", RegisterTabs se
// desmonta y este estado se borra solo (no quedan datos personales en memoria).
import React, { createContext, useCallback, useMemo, useState } from 'react';
import { getPersonalDataErrors, getVehicleErrors, getDocumentsErrors } from '../utils/registrationErrors';
import useSession from '../hooks/useSession';

// Valores iniciales del formulario (las 3 pestañas).
const INITIAL_FORM = {
  // Pestaña 1: datos personales
  fullName: '',
  documentNumber: '',
  phone: '',
  birthDate: null, // Date
  gender: '',
  language: 'es', // preseleccionado: es el idioma de la app
  // Pestaña 2: vehículo (año y capacidad como texto, igual que en el TextInput)
  category: '',
  plate: '',
  brand: '',
  model: '',
  year: '',
  color: '',
  capacity: '',
  // Pestaña 3: documentos y pagos (las fechas como Date)
  licenseNumber: '',
  licenseExpiry: null,
  soatExpiry: null,
  technicalReviewExpiry: null, // solo se exige si el vehículo tiene 5 años o más
  mercadoPagoEmail: '', // se prellena con el correo de la cuenta (ver abajo)
  termsAccepted: false,
};

export const RegistrationContext = createContext(null);

export function RegistrationProvider({ children }) {
  const { user } = useSession();
  // El correo de Mercado Pago empieza con el de la cuenta, pero se puede cambiar
  // si el conductor usa otro correo en Mercado Pago.
  const [form, setForm] = useState(() => ({ ...INITIAL_FORM, mercadoPagoEmail: user?.email ?? '' }));
  // touched[campo] = true cuando el conductor ya salió de ese campo: solo
  // entonces se muestra su error (no se regaña antes de que escriba).
  const [touched, setTouched] = useState({});

  // useCallback: la función es la misma en cada render, así las pantallas
  // que la reciben no se vuelven a dibujar sin necesidad.
  const setField = useCallback((name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  }, []);

  const touchFields = useCallback((names) => {
    setTouched((current) => {
      const next = { ...current };
      names.forEach((name) => {
        next[name] = true;
      });
      return next;
    });
  }, []);

  // Los errores no se guardan en el estado: se calculan desde el formulario.
  // Así nunca quedan desactualizados respecto a lo que está escrito.
  const personalDataErrors = useMemo(() => getPersonalDataErrors(form), [form]);
  const vehicleErrors = useMemo(() => getVehicleErrors(form), [form]);
  const documentsErrors = useMemo(() => getDocumentsErrors(form), [form]);

  const value = useMemo(
    () => ({ form, touched, personalDataErrors, vehicleErrors, documentsErrors, setField, touchFields }),
    [form, touched, personalDataErrors, vehicleErrors, documentsErrors, setField, touchFields]
  );

  return <RegistrationContext.Provider value={value}>{children}</RegistrationContext.Provider>;
}
