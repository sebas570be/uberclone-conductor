// src/components/TextField.js
// Campo de texto con etiqueta y error debajo. Las demás props (keyboardType,
// maxLength, autoCapitalize...) pasan directo al TextInput con ...inputProps.
// Teclado:
// - returnKeyType="done": la tecla Enter dice "Listo" y cierra el teclado.
// - iOS: el teclado numérico (number-pad) NO tiene tecla Enter, así que no se
//   podía cerrar. Antes se usaba una barra "Listo" (InputAccessoryView), pero
//   React Native la marcó como obsoleta. Ahora, en iOS, los campos numéricos
//   usan "numbers-and-punctuation", que sí trae Enter. Si alguien escribe un
//   símbolo, el validador lo rechaza igual. Android sí trae Enter en number-pad.
import React from 'react';
import { TextInput, Platform } from 'react-native';
import FormField from './FormField';
import { formStyles } from './formStyles';

export default function TextField({ label, error, hint, editable = true, keyboardType, ...inputProps }) {
  const resolvedKeyboardType =
    Platform.OS === 'ios' && keyboardType === 'number-pad' ? 'numbers-and-punctuation' : keyboardType;

  return (
    <FormField label={label} error={error} hint={hint}>
      <TextInput
        style={[formStyles.input, error && formStyles.inputError, !editable && formStyles.inputDisabled]}
        editable={editable}
        accessibilityLabel={label}
        placeholderTextColor="#9CA3AF"
        returnKeyType="done"
        keyboardType={resolvedKeyboardType}
        {...inputProps}
      />
    </FormField>
  );
}
