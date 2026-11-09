// src/components/formStyles.js
// Estilos compartidos por los campos de formulario, para que todos se vean
// iguales (mismos colores y medidas que el LoginScreen).
import { StyleSheet } from 'react-native';

export const formStyles = StyleSheet.create({
  field: {
    marginTop: 12,
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#DC2626',
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  placeholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  valueText: {
    fontSize: 16,
    color: '#111827',
  },
  hint: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B7280',
  },
  errorText: {
    marginTop: 6,
    fontSize: 13,
    color: '#DC2626',
  },
  // Botón "Listo" que cierra la rueda en iOS (fecha y listas).
  doneButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  doneText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
  },
});
