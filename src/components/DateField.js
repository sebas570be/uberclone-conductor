// src/components/DateField.js
// Selector de fecha con @react-native-community/datetimepicker.
// - Android: al tocar se abre un diálogo; se cierra solo al elegir o cancelar.
// - iOS: al tocar aparece una rueda debajo del campo y un botón "Listo".
// La fecha se guarda como Date; el texto se muestra como dd/mm/aaaa.
import React, { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import FormField from './FormField';
import { formStyles } from './formStyles';
import { formatDate } from '../utils/dates';

export default function DateField({
  label,
  value, // Date o null
  onChange, // recibe la Date elegida
  onClose, // se llama al cerrar el selector: ahí se marca el campo como visitado
  error,
  defaultDate = new Date(), // fecha en la que abre la rueda si todavía no hay valor
  minimumDate,
  maximumDate,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const shownDate = value ?? defaultDate;

  const close = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      // En Android hay que cerrarlo primero; si no, el diálogo vuelve a abrirse.
      setIsOpen(false);
      if (event.type === 'set' && selectedDate) onChange(selectedDate);
      onClose?.();
      return;
    }
    // iOS: cada giro de la rueda llega aquí.
    if (selectedDate) onChange(selectedDate);
  };

  // iOS: si toca "Listo" sin girar la rueda, acepta la fecha que estaba viendo.
  const handleDone = () => {
    if (!value) onChange(shownDate);
    close();
  };

  return (
    <FormField label={label} error={error}>
      <Pressable
        style={[formStyles.input, error && formStyles.inputError]}
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatDate(value) : 'sin elegir'}`}
      >
        <Text style={value ? formStyles.valueText : formStyles.placeholder}>
          {value ? formatDate(value) : 'Toca para elegir la fecha'}
        </Text>
      </Pressable>

      {isOpen && (
        <View>
          <DateTimePicker
            value={shownDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            locale="es-CO" // solo iOS: nombres de los meses en español
            themeVariant="light" // solo iOS: evita letras blancas sobre fondo blanco
          />
          {Platform.OS === 'ios' && (
            <Pressable style={formStyles.doneButton} onPress={handleDone} accessibilityRole="button">
              <Text style={formStyles.doneText}>Listo</Text>
            </Pressable>
          )}
        </View>
      )}
    </FormField>
  );
}

