// src/screens/register/PersonalDataScreen.js
// Pestaña 1 del registro: datos personales (enunciado §2).
// Los datos viven en el RegistrationContext, no en esta pantalla: así no se
// pierden al cambiar de pestaña. El error de cada campo aparece debajo de él
// cuando el conductor sale del campo (onBlur) o toca "Siguiente".
// Textos en el idioma elegido (useLanguage). Elegir el Idioma aquí cambia la
// app al instante (enunciado: mismo selector de la app del pasajero).
import React from 'react';
import { ScrollView, Text, Pressable } from 'react-native';
import TextField from '../../components/TextField';
import SelectField from '../../components/SelectField';
import DateField from '../../components/DateField';
import PhotoField from '../../components/PhotoField';
import { formStyles } from '../../components/formStyles';
import useRegistration from '../../hooks/useRegistration';
import useSession from '../../hooks/useSession';
import useLanguage from '../../hooks/useLanguage';
import { GENDER_OPTIONS, LANGUAGE_OPTIONS } from '../../constants/registrationOptions';
import { translatedOptions } from '../../i18n/labels';
import { LANGUAGE_NAMES } from '../../i18n/translate';
import { REGISTRATION_RULES } from '../../config/registration';
import { hasErrors } from '../../utils/registrationErrors';
import { yearsAgo } from '../../utils/dates';
import { PERSONAL_DATA_FIELDS } from '../../constants/registrationFields';

export default function PersonalDataScreen({ navigation }) {
  const { user } = useSession();
  const { t, changeLanguage } = useLanguage();
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
      keyboardDismissMode="on-drag" // al deslizar la pantalla se oculta el teclado
      automaticallyAdjustKeyboardInsets // iOS: deja ver el campo cuando sale el teclado
    >
      <Text style={formStyles.step}>{t('register.step', { number: 1 })}</Text>

      <PhotoField
        label={t('fields.profilePhoto')}
        value={form.profilePhoto}
        onChange={(uri) => setField('profilePhoto', uri)}
        onClose={touch('profilePhoto')}
        error={errorFor('profilePhoto')}
      />

      <TextField
        label={t('fields.fullName')}
        value={form.fullName}
        onChangeText={(text) => setField('fullName', text)}
        onBlur={touch('fullName')}
        error={errorFor('fullName')}
        maxLength={REGISTRATION_RULES.maxNameLength}
        autoCapitalize="words"
        autoComplete="name"
        placeholder={t('register.fullNamePlaceholder')}
      />

      <TextField
        label={t('register.documentNumber')}
        value={form.documentNumber}
        onChangeText={(text) => setField('documentNumber', text)}
        onBlur={touch('documentNumber')}
        error={errorFor('documentNumber')}
        keyboardType="number-pad"
        maxLength={10}
        placeholder={t('register.documentPlaceholder')}
      />

      <TextField
        label={t('fields.phone')}
        value={form.phone}
        onChangeText={(text) => setField('phone', text)}
        onBlur={touch('phone')}
        error={errorFor('phone')}
        keyboardType="number-pad"
        maxLength={10}
        autoComplete="tel"
        placeholder={t('register.phonePlaceholder')}
      />

      <DateField
        label={t('fields.birthDate')}
        value={form.birthDate}
        onChange={(date) => setField('birthDate', date)}
        onClose={touch('birthDate')}
        error={errorFor('birthDate')}
        defaultDate={yearsAgo(REGISTRATION_RULES.minAge)}
        minimumDate={new Date(1900, 0, 1)}
        maximumDate={new Date()}
      />

      <SelectField
        label={t('fields.gender')}
        value={form.gender}
        options={translatedOptions(t, GENDER_OPTIONS, 'gender')}
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
        label={t('fields.email')}
        value={user?.email ?? ''}
        editable={false}
        hint={t('register.emailHint')}
      />

      <SelectField
        label={t('fields.language')}
        value={form.language}
        // Cada idioma con su nombre en ese idioma (Español / English).
        options={LANGUAGE_OPTIONS.map((option) => ({ value: option.value, label: LANGUAGE_NAMES[option.value] }))}
        onChange={(value) => {
          setField('language', value);
          touchFields(['language']);
          if (value) changeLanguage(value); // la app cambia de idioma al instante
        }}
        onClose={touch('language')}
        error={errorFor('language')}
      />

      <Pressable style={formStyles.primaryButton} onPress={handleNext} accessibilityRole="button">
        <Text style={formStyles.primaryButtonText}>{t('register.nextVehicle')}</Text>
      </Pressable>
    </ScrollView>
  );
}

