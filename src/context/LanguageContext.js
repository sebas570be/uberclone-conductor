// src/context/LanguageContext.js
// Context del idioma (enunciado: idioma español / inglés; AsyncStorage solo
// para preferencias como el idioma). Igual que el SessionContext: un Provider
// arriba de la navegación y un hook (useLanguage) para leerlo.
// - Al abrir la app: el idioma guardado en el celular (AsyncStorage).
// - Si el celular no tiene ninguno (por ejemplo, otro celular): el del
//   registro del conductor (campo language en Firestore).
// - Al cambiarlo en Configuración: se guarda en los dos lugares.
// AI-assisted: see docs/AI_LOG.md #18
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import useSession from '../hooks/useSession';
import { DICTIONARIES, DEFAULT_LANGUAGE, isSupportedLanguage, translate } from '../i18n/translate';
import { getSavedLanguage, saveLanguage } from '../services/preferencesService';
import { updateDriverLanguage } from '../services/driverService';

export const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const { user, driver } = useSession();
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  // true cuando el celular ya tiene un idioma elegido: manda sobre el del registro.
  const [hasDeviceLanguage, setHasDeviceLanguage] = useState(false);

  // 1) Idioma guardado en el celular.
  useEffect(() => {
    let isMounted = true;
    getSavedLanguage().then((saved) => {
      if (isMounted && isSupportedLanguage(saved)) {
        setLanguage(saved);
        setHasDeviceLanguage(true);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // 2) Sin idioma en el celular: el del registro del conductor.
  const driverLanguage = driver?.language;
  useEffect(() => {
    if (!hasDeviceLanguage && isSupportedLanguage(driverLanguage)) {
      setLanguage(driverLanguage);
    }
  }, [driverLanguage, hasDeviceLanguage]);

  // Cambiar el idioma (Configuración). El celular cambia al instante; en
  // Firestore solo si hay un conductor registrado. Si Firestore falla, el error
  // sube a la pantalla para avisar (el celular ya quedó con el idioma nuevo).
  const changeLanguage = useCallback(
    async (nextLanguage) => {
      if (!isSupportedLanguage(nextLanguage)) return;
      setLanguage(nextLanguage);
      setHasDeviceLanguage(true);
      await saveLanguage(nextLanguage);
      if (user && driver && driver.language !== nextLanguage) {
        await updateDriverLanguage(user.uid, driver, nextLanguage);
      }
    },
    [user, driver]
  );

  // t('drawer.history') → texto en el idioma actual.
  const t = useCallback((key, params) => translate(DICTIONARIES, language, key, params), [language]);

  // useMemo: las pantallas solo se vuelven a dibujar si cambia el idioma.
  const value = useMemo(() => ({ language, t, changeLanguage }), [language, t, changeLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
