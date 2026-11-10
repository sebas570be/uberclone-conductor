// src/screens/register/VehicleScreen.js
// Pestaña 2 del registro: vehículo (enunciado §2).
// Igual que Datos personales: los datos viven en el RegistrationContext y el
// error aparece debajo del campo al salir de él o al tocar "Siguiente".
import React from 'react';
import { ScrollView, Text, Pressable } from 'react-native';
import TextField from '../../components/TextField';
import SelectField from '../../components/SelectField';
import PhotoField from '../../components/PhotoField';
import { formStyles } from '../../components/formStyles';
import useRegistration from '../../hooks/useRegistration';
import { CATEGORY_OPTIONS, COLOR_OPTIONS, labelFor } from '../../constants/registrationOptions';
import { REGISTRATION_RULES } from '../../config/registration';
import { hasErrors } from '../../utils/registrationErrors';
import { normalizePlate } from '../../utils/validators';
import { VEHICLE_FIELDS } from '../../constants/registrationFields';

export default function VehicleScreen({ navigation }) {
  const { form, touched, vehicleErrors, setField, touchFields } = useRegistration();

  const errorFor = (name) => (touched[name] ? vehicleErrors[name] : undefined);
  const touch = (name) => () => touchFields([name]);

  // Mínimo de pasajeros de la categoría elegida, para mostrarlo como ayuda.
  const minimumCapacity = REGISTRATION_RULES.minCapacity[form.category];
  const capacityHint =
    minimumCapacity === undefined
      ? undefined
      : `Mínimo ${minimumCapacity} para ${labelFor(CATEGORY_OPTIONS, form.category)}.`;

  const handleNext = () => {
    touchFields(VEHICLE_FIELDS);
    if (!hasErrors(vehicleErrors)) {
      navigation.navigate('Documents');
    }
  };

  return (
    <ScrollView
      style={formStyles.screen}
      contentContainerStyle={formStyles.container}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag" // al deslizar la pantalla se oculta el teclado
      automaticallyAdjustKeyboardInsets
    >
      <Text style={formStyles.step}>Paso 2 de 3</Text>

      {/* Al cambiar la categoría NO se borra la capacidad: el error de capacidad
          se recalcula solo (los errores salen de todo el formulario). */}
      <SelectField
        label="Categoría"
        value={form.category}
        options={CATEGORY_OPTIONS}
        onChange={(value) => {
          setField('category', value);
          touchFields(['category']);
        }}
        onClose={touch('category')}
        error={errorFor('category')}
      />

      {/* Enunciado: pasar a mayúsculas ANTES de validar. Se guarda ya convertida,
          así en Firestore nunca queda "abc123". */}
      <TextField
        label="Placa"
        value={form.plate}
        onChangeText={(text) => setField('plate', normalizePlate(text))}
        onBlur={touch('plate')}
        error={errorFor('plate')}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={6}
        placeholder="Ej.: ABC123"
      />

      <TextField
        label="Marca"
        value={form.brand}
        onChangeText={(text) => setField('brand', text)}
        onBlur={touch('brand')}
        error={errorFor('brand')}
        maxLength={REGISTRATION_RULES.maxBrandModelLength}
        autoCapitalize="words"
        placeholder="Ej.: Chevrolet"
      />

      <TextField
        label="Modelo"
        value={form.model}
        onChangeText={(text) => setField('model', text)}
        onBlur={touch('model')}
        error={errorFor('model')}
        maxLength={REGISTRATION_RULES.maxBrandModelLength}
        autoCapitalize="words"
        placeholder="Ej.: Spark"
      />

      <TextField
        label="Año"
        value={form.year}
        onChangeText={(text) => setField('year', text)}
        onBlur={touch('year')}
        error={errorFor('year')}
        keyboardType="number-pad"
        maxLength={4}
        placeholder="Ej.: 2020"
      />

      <SelectField
        label="Color"
        value={form.color}
        options={COLOR_OPTIONS}
        onChange={(value) => {
          setField('color', value);
          touchFields(['color']);
        }}
        onClose={touch('color')}
        error={errorFor('color')}
      />

      <TextField
        label="Capacidad (pasajeros)"
        value={form.capacity}
        onChangeText={(text) => setField('capacity', text)}
        onBlur={touch('capacity')}
        error={errorFor('capacity')}
        hint={capacityHint}
        keyboardType="number-pad"
        maxLength={2}
      />

      {/* Enunciado: la placa debe verse en la foto. No se puede verificar
          automáticamente: se le pide al conductor y lo revisa quien aprueba. */}
      <PhotoField
        label="Foto del vehículo"
        hint="Debe verse la placa."
        value={form.vehiclePhoto}
        onChange={(uri) => setField('vehiclePhoto', uri)}
        onClose={touch('vehiclePhoto')}
        error={errorFor('vehiclePhoto')}
      />

      <Pressable style={formStyles.primaryButton} onPress={handleNext} accessibilityRole="button">
        <Text style={formStyles.primaryButtonText}>Siguiente: Documentos</Text>
      </Pressable>

      {/* Volver siempre se permite (lo escrito se conserva en el Context). */}
      <Pressable
        style={formStyles.secondaryButton}
        onPress={() => navigation.navigate('PersonalData')}
        accessibilityRole="button"
      >
        <Text style={formStyles.secondaryButtonText}>Atrás: Datos personales</Text>
      </Pressable>
    </ScrollView>
  );
}
