// src/components/TextField.js
// Campo de texto con etiqueta y error debajo. Las demás props (keyboardType,
// maxLength, autoCapitalize...) pasan directo al TextInput con ...inputProps.
import React from 'react';
import { TextInput } from 'react-native';
import FormField from './FormField';
import { formStyles } from './formStyles';

export default function TextField({ label, error, hint, editable = true, ...inputProps }) {
  return (
    <FormField label={label} error={error} hint={hint}>
      <TextInput
        style={[formStyles.input, error && formStyles.inputError, !editable && formStyles.inputDisabled]}
        editable={editable}
        accessibilityLabel={label}
        placeholderTextColor="#9CA3AF"
        {...inputProps}
      />
    </FormField>
  );
}
