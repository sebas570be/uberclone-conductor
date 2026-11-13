// src/hooks/useLanguage.js
// Hook para leer el LanguageContext: { language, t, changeLanguage }.
// AI-assisted: see docs/AI_LOG.md #18
import { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';

export default function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage debe usarse dentro de un <LanguageProvider>.');
  }
  return context;
}
