// src/context/RegistrationContext.js
// Estado compartido del formulario de registro (las 3 pestañas).
// Vive en RegisterTabs: así lo escrito en una pestaña no se pierde al pasar
// a otra, y el botón "Enviar registro" (pestaña 3) puede revisar las tres.
// Cuando el registro se envía, el estado cambia a "pending", RegisterTabs se
// desmonta y este estado se borra solo (no quedan datos personales en memoria).
import React, { createContext, useCallback, useMemo, useState } from 'react';
import { getPersonalDataErrors } from '../utils/registrationErrors';

// Valores iniciales. Los campos de Vehículo y Documentos se agregan en sus commits.
const INITIAL_FORM = {
  fullName: '',
  documentNumber: '',
  phone: '',
  birthDate: null, // Date
  gender: '',
  language: 'es', // preseleccionado: es el idioma de la app
};

export const RegistrationContext = createContext(null);

export function RegistrationProvider({ children }) {
  const [form, setForm] = useState(INITIAL_FORM);
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

  const value = useMemo(
    () => ({ form, touched, personalDataErrors, setField, touchFields }),
    [form, touched, personalDataErrors, setField, touchFields]
  );

  return <RegistrationContext.Provider value={value}>{children}</RegistrationContext.Provider>;
}
