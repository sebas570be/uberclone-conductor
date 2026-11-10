// src/components/PhotoField.js
// Campo de foto: vista previa + "Tomar foto" y "Galería". La foto se guarda
// como uri local en el formulario y se sube a Cloudinary al enviar el registro.
// Si el conductor niega el permiso, se explica debajo y se ofrece abrir los
// Ajustes del celular (Linking.openSettings), porque la app ya no puede
// volver a preguntar.
import React, { useState } from 'react';
import { View, Text, Image, Pressable, Linking, StyleSheet } from 'react-native';
import FormField from './FormField';
import { formStyles } from './formStyles';
import { pickPhoto } from '../services/photoService';

export default function PhotoField({ label, hint, value, onChange, onClose, error }) {
  const [deniedSource, setDeniedSource] = useState(null); // 'camera' | 'library' | null

  const handlePick = async (source) => {
    setDeniedSource(null);
    const result = await pickPhoto(source);
    if (result.status === 'denied') {
      setDeniedSource(source);
    } else if (result.status === 'ok') {
      onChange(result.uri);
    }
    onClose?.(); // elegida o cancelada: el campo ya se visitó
  };

  return (
    <FormField label={label} error={error} hint={hint}>
      {value ? (
        <Image source={{ uri: value }} style={styles.preview} accessibilityLabel={`${label}: foto elegida`} />
      ) : (
        <View style={[styles.preview, styles.empty, error && formStyles.inputError]}>
          <Text style={formStyles.placeholder}>Sin foto</Text>
        </View>
      )}

      <View style={styles.buttons}>
        <Pressable style={[styles.button, styles.buttonLeft]} onPress={() => handlePick('camera')} accessibilityRole="button" accessibilityLabel={`${label}: tomar foto`}>
          <Text style={styles.buttonText}>{value ? 'Tomar otra' : 'Tomar foto'}</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => handlePick('library')} accessibilityRole="button" accessibilityLabel={`${label}: elegir de la galería`}>
          <Text style={styles.buttonText}>Galería</Text>
        </Pressable>
      </View>

      {deniedSource ? (
        <View style={styles.denied}>
          <Text style={formStyles.errorText}>
            Sin permiso para usar la {deniedSource === 'camera' ? 'cámara' : 'galería'}. Actívalo en los Ajustes del celular.
          </Text>
          <Pressable onPress={() => Linking.openSettings()} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.settingsLink}>Abrir Ajustes</Text>
          </Pressable>
        </View>
      ) : null}
    </FormField>
  );
}

const styles = StyleSheet.create({
  preview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
  },
  buttons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#111827',
    alignItems: 'center',
  },
  buttonLeft: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  denied: {
    marginTop: 4,
  },
  settingsLink: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
});
