// src/components/SelectField.js
// Lista desplegable (enunciado: Género, Color) con @react-native-picker/picker.
// - Android: el Picker ya es una lista que se despliega al tocarla.
// - iOS: el Picker es una rueda grande; para no ocupar media pantalla, se
//   muestra un campo con la opción elegida y la rueda aparece solo al tocarlo,
//   con un botón "Listo" (igual que DateField).
// La primera opción vacía obliga a elegir: si queda en "", hay error.
import React, { useState } from 'react';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import FormField from './FormField';
import { formStyles } from './formStyles';

export default function SelectField({
  label,
  value,
  options,
  onChange,
  onClose, // iOS: se llama al tocar "Listo"; ahí se marca el campo como visitado
  error,
  placeholder = 'Selecciona una opción',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  const items = [
    <Picker.Item key="" label={placeholder} value="" color="#9CA3AF" />,
    ...options.map((option) => <Picker.Item key={option.value} label={option.label} value={option.value} />),
  ];

  if (Platform.OS === 'android') {
    return (
      <FormField label={label} error={error}>
        <View style={[formStyles.input, styles.pickerBox, error && formStyles.inputError]}>
          <Picker selectedValue={value} onValueChange={onChange} mode="dropdown" accessibilityLabel={label}>
            {items}
          </Picker>
        </View>
      </FormField>
    );
  }

  const close = () => {
    setIsOpen(false);
    onClose?.();
  };

  return (
    <FormField label={label} error={error}>
      <Pressable
        style={[formStyles.input, error && formStyles.inputError]}
        onPress={() => (isOpen ? close() : setIsOpen(true))}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selectedOption ? selectedOption.label : 'sin elegir'}`}
        accessibilityState={{ expanded: isOpen }}
      >
        <Text style={selectedOption ? formStyles.valueText : formStyles.placeholder}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
      </Pressable>

      {isOpen && (
        <View>
          <Picker selectedValue={value} onValueChange={onChange} accessibilityLabel={label}>
            {items}
          </Picker>
          <Pressable style={formStyles.doneButton} onPress={close} accessibilityRole="button">
            <Text style={formStyles.doneText}>Listo</Text>
          </Pressable>
        </View>
      )}
    </FormField>
  );
}

const styles = StyleSheet.create({
  // Android: el Picker trae su propio relleno; se quita el del input para que no se corte.
  pickerBox: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
});
