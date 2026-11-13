// src/screens/main/SettingsScreen.js
// Configuración (enunciado §3.7: idioma y cierre de sesión).
// El idioma se guarda en el celular (AsyncStorage) y en la cuenta (Firestore)
// a través del LanguageContext. Cerrar sesión usa la misma función del menú.
// AI-assisted: see docs/AI_LOG.md #18
import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { formStyles } from '../../components/formStyles';
import useSession from '../../hooks/useSession';
import useLanguage from '../../hooks/useLanguage';
import { DICTIONARIES, LANGUAGE_NAMES } from '../../i18n/translate';
import { signOutDriver } from '../../services/authService';

const LANGUAGES = Object.keys(DICTIONARIES); // ['es', 'en']

export default function SettingsScreen() {
  const { user } = useSession();
  const { language, t, changeLanguage } = useLanguage();
  const [hasSaveError, setHasSaveError] = useState(false);

  const handleLanguage = async (nextLanguage) => {
    setHasSaveError(false);
    try {
      await changeLanguage(nextLanguage);
    } catch (error) {
      console.log('No se pudo guardar el idioma en la cuenta:', error?.code, error?.message);
      setHasSaveError(true);
    }
  };

  const handleSignOut = () => {
    signOutDriver(user?.uid).catch((error) => console.log('Error al cerrar sesión:', error?.code));
  };

  return (
    <ScrollView style={formStyles.screen} contentContainerStyle={formStyles.container}>
      <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
      <View style={styles.options} accessibilityRole="radiogroup">
        {LANGUAGES.map((code) => {
          const isSelected = code === language;
          return (
            <Pressable
              key={code}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => handleLanguage(code)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{LANGUAGE_NAMES[code]}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={formStyles.hint}>{t('settings.languageHint')}</Text>
      {hasSaveError ? (
        <Text style={formStyles.errorText} accessibilityLiveRegion="polite">
          {t('settings.languageSaveError')}
        </Text>
      ) : null}

      <Text style={[styles.sectionTitle, styles.spaced]}>{t('settings.account')}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Pressable style={styles.signOutButton} onPress={handleSignOut} accessibilityRole="button">
        <Text style={styles.signOutText}>{t('settings.signOut')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    marginTop: 8,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  spaced: {
    marginTop: 28,
  },
  options: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#111827',
    backgroundColor: '#FFFFFF',
  },
  optionSelected: {
    backgroundColor: '#111827',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  email: {
    fontSize: 16,
    color: '#111827',
  },
  signOutButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DC2626',
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
  },
});
