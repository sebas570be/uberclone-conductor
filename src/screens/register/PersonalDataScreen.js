// src/screens/register/PersonalDataScreen.js
// Pestaña 1 del registro: datos personales (enunciado §2).
// Los datos viven en el RegistrationContext, no en esta pantalla: así no se
// pierden al cambiar de pestaña. El error de cada campo aparece debajo de él
// cuando el conductor sale del campo (onBlur) o toca "Siguiente".
// La foto de perfil se agrega en el commit de fotos (expo-image-picker).
import React from 'react';
import { ScrollView, Text, Pressable } from 'react-native';
import TextField from '../../components/TextField';
import SelectField from '../../components/SelectField';
import DateField from '../../components/DateField';
import { formStyles } from '../../components/formStyles';
import useRegistration from '../../hooks/useRegistration';
import useSession from '../../hooks/useSession';
import { GENDER_OPTIONS, LANGUAGE_OPTIONS } from '../../constants/registrationOptions';
import { REGISTRATION_RULES } from '../../config/registration';
import { hasErrors } from '../../utils/registrationErrors';
import { yearsAgo } from '../../utils/dates';
import { PERSONAL_DATA_FIELDS } from '../../constants/registrationFields';

export default function PersonalDataScreen({ navigation }) {
  const { user } = useSession();
  const { form, touched, personalDataErrors, setField, touchFields } = useRegistration();

  // Solo se muestra el error de un campo que el conductor ya visitó.
  const errorFor = (name) => (touched[name] ? personalDataErrors[name] : undefined);
  const touch = (name) => () => touchFields([name]);

  // "Siguiente" marca todos los campos: si falta alguno, se ven todos los errores.
  const handleNext = () => {
    touchFields(PERSONAL_DATA_FIELDS);
    if (!hasErrors(personalDataErrors)) {
      navigation.navigate('Vehicle');
    }
  };

  return (
    <ScrollView
      style={formStyles.screen}
      contentContainerStyle={formStyles.container}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets // iOS: deja ver el campo cuando sale el teclado
    >
      <Text style={formStyles.step}>Paso 1 de 3</Text>

      <TextField
        label="Nombre completo"
        value={form.fullName}
        onChangeText={(text) => setField('fullName', text)}
        onBlur={touch('fullName')}
        error={errorFor('fullName')}
        maxLength={REGISTRATION_RULES.maxNameLength}
        autoCapitalize="words"
        autoComplete="name"
        placeholder="Como aparece en tu documento"
      />

      <TextField
        label="Número de documento"
        value={form.documentNumber}
        onChangeText={(text) => setField('documentNumber', text)}
        onBlur={touch('documentNumber')}
        error={errorFor('documentNumber')}
        keyboardType="number-pad"
        maxLength={10}
        placeholder="Entre 6 y 10 números"
      />

      <TextField
        label="Celular"
        value={form.phone}
        onChangeText={(text) => setField('phone', text)}
        onBlur={touch('phone')}
        error={errorFor('phone')}
        keyboardType="number-pad"
        maxLength={10}
        autoComplete="tel"
        placeholder="Ej.: 3001234567"
      />

      <DateField
        label="Fecha de nacimiento"
        value={form.birthDate}
        onChange={(date) => setField('birthDate', date)}
        onClose={touch('birthDate')}
        error={errorFor('birthDate')}
        defaultDate={yearsAgo(REGISTRATION_RULES.minAge)}
        minimumDate={new Date(1900, 0, 1)}
        maximumDate={new Date()}
      />

      <SelectField
        label="Género"
        value={form.gender}
        options={GENDER_OPTIONS}
        onChange={(value) => {
          setField('gender', value);
          touchFields(['gender']);
        }}
        onClose={touch('gender')}
        error={errorFor('gender')}
      />

      {/* El correo es el de la cuenta (Firebase Auth): no se puede editar, así
          el correo del registro y el de inicio de sesión siempre coinciden. */}
      <TextField
        label="Correo"
        value={user?.email ?? ''}
        editable={false}
        hint="Es el correo de tu cuenta."
      />

      <SelectField
        label="Idioma"
        value={form.language}
        options={LANGUAGE_OPTIONS}
        onChange={(value) => {
          setField('language', value);
          touchFields(['language']);
        }}
        onClose={touch('language')}
        error={errorFor('language')}
      />

      <Pressable style={formStyles.primaryButton} onPress={handleNext} accessibilityRole="button">
        <Text style={formStyles.primaryButtonText}>Siguiente: Vehículo</Text>
      </Pressable>
    </ScrollView>
  );
}

