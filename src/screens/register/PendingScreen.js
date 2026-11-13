// src/screens/register/PendingScreen.js
// Registro en revisión (enunciado §2: al enviar, estado "pending"; el conductor
// no puede ponerse Disponible hasta "approved"). También se llega aquí al enviar
// a revisión cambios de identidad, vehículo o documentos desde el Perfil.
// No hace falta ningún botón para seguir: cuando lo aprueban en la base de
// datos, el SessionContext lo detecta y RootNavigator muestra el menú solo.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useLanguage from '../../hooks/useLanguage';

export default function PendingScreen() {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <Text style={styles.icon} accessibilityElementsHidden importantForAccessibility="no">
        ⏳
      </Text>
      <Text style={styles.title} accessibilityRole="header">
        {t('pending.heading')}
      </Text>
      <Text style={styles.message}>{t('pending.message')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  icon: {
    fontSize: 48,
  },
  title: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111827',
  },
  message: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: '#6B7280',
  },
});
