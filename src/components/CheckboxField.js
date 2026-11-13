// src/components/CheckboxField.js
// Casilla de verificación (React Native no trae una): un Pressable con un
// cuadro que muestra ✓ cuando está marcada. El error va DEBAJO, como en los
// demás campos. accessibilityRole="checkbox" + accessibilityState.checked le
// dicen al lector de pantalla qué es y si está marcada.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { formStyles } from './formStyles';
import useLanguage from '../hooks/useLanguage';
import { errorText } from '../i18n/labels';

export default function CheckboxField({ label, checked, onChange, error }) {
  const { t } = useLanguage();

  return (
    <View style={formStyles.field}>
      <Pressable
        style={styles.row}
        onPress={() => onChange(!checked)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={label}
        hitSlop={8}
      >
        <View style={[styles.box, checked && styles.boxChecked, error && formStyles.inputError]}>
          {checked ? <Text style={styles.check}>✓</Text> : null}
        </View>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
      {error ? (
        <Text style={formStyles.errorText} accessibilityLiveRegion="polite">
          {errorText(t, error)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  box: {
    width: 24,
    height: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    borderColor: '#111827',
    backgroundColor: '#111827',
  },
  check: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  label: {
    flex: 1, // el texto largo baja de línea en vez de salirse de la pantalla
    fontSize: 15,
    color: '#111827',
  },
});
