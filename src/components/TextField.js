// src/components/TextField.js
// Campo de texto con etiqueta y error debajo. Las demás props (keyboardType,
// maxLength, autoCapitalize...) pasan directo al TextInput con ...inputProps.
// Teclado:
// - returnKeyType="done": la tecla Enter dice "Listo" y cierra el teclado.
// - iOS: el teclado numérico (number-pad) NO tiene tecla Enter. Por eso se
//   agrega una barra encima del teclado con un botón "Listo" (InputAccessoryView,
//   componente de React Native solo para iOS). Android sí trae la tecla.
import React, { useId } from 'react';
import { TextInput, InputAccessoryView, View, Pressable, Text, Keyboard, Platform, StyleSheet } from 'react-native';
import FormField from './FormField';
import { formStyles } from './formStyles';

export default function TextField({ label, error, hint, editable = true, ...inputProps }) {
  // useId da un identificador único por campo para enlazar el campo con su barra.
  const accessoryId = useId();
  const showAccessory = Platform.OS === 'ios' && editable;

  return (
    <FormField label={label} error={error} hint={hint}>
      <TextInput
        style={[formStyles.input, error && formStyles.inputError, !editable && formStyles.inputDisabled]}
        editable={editable}
        accessibilityLabel={label}
        placeholderTextColor="#9CA3AF"
        returnKeyType="done"
        inputAccessoryViewID={showAccessory ? accessoryId : undefined}
        {...inputProps}
      />
      {showAccessory && (
        <InputAccessoryView nativeID={accessoryId}>
          <View style={styles.accessoryBar}>
            <Pressable onPress={Keyboard.dismiss} style={formStyles.doneButton} accessibilityRole="button">
              <Text style={formStyles.doneText}>Listo</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}
    </FormField>
  );
}

const styles = StyleSheet.create({
  // Barra gris clara encima del teclado, como la de las apps de iOS.
  accessoryBar: {
    alignItems: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
  },
});
