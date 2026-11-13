// src/components/SignOutButton.js
// Botón "Salir" para el encabezado de las pantallas donde todavía no hay menú
// (registro y pendiente de aprobación). Al cerrar sesión, el SessionContext
// detecta el cambio y la navegación vuelve sola al inicio de sesión.
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { signOut } from '../services/authService';
import useLanguage from '../hooks/useLanguage';

export default function SignOutButton() {
  const { t } = useLanguage();

  const handlePress = () => {
    signOut().catch((error) => {
      console.log('No se pudo cerrar sesión:', error.code);
    });
  };

  return (
    <Pressable onPress={handlePress} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('drawer.signOut')}>
      <Text style={styles.text}>{t('common.exit')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
});
