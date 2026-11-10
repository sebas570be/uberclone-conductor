// src/components/FormField.js
// Envoltura de un campo: etiqueta arriba, el control en el medio y el error
// DEBAJO (regla del enunciado: nunca en Alert). La usan TextField, SelectField
// y DateField para que todos los campos se vean y se comporten igual.
import React from 'react';
import { View, Text } from 'react-native';
import { formStyles } from './formStyles';

export default function FormField({ label, error, hint, children }) {
  return (
    <View style={formStyles.field}>
      <Text style={formStyles.label}>{label}</Text>
      {children}
      {hint && !error ? <Text style={formStyles.hint}>{hint}</Text> : null}
      {/* accessibilityLiveRegion: en Android el lector de pantalla lee el error cuando aparece */}
      {error ? (
        <Text style={formStyles.errorText} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
