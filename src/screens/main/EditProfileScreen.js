// src/screens/main/EditProfileScreen.js
// Editar los datos que requieren una nueva aprobación (enunciado §3.7):
// identidad (foto, nombre, género), vehículo y documentos. Quien aprueba los
// compara con los documentos, así que al enviarlos el registro vuelve a
// "Pendiente de aprobación". Las reglas de Firestore también lo exigen: una
// app modificada no puede cambiar estos datos y seguir aprobada.
// Mismos campos y validaciones del registro (registrationErrors).
// Textos en el idioma elegido (useLanguage). Los mensajes de validación y los
// textos de PhotoField/DateField se traducen con el registro.
import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import TextField from '../../components/TextField';
import SelectField from '../../components/SelectField';
import DateField from '../../components/DateField';
import PhotoField from '../../components/PhotoField';
import { formStyles } from '../../components/formStyles';
import useSession from '../../hooks/useSession';
import useActiveTrip from '../../hooks/useActiveTrip';
import useLanguage from '../../hooks/useLanguage';
import { GENDER_OPTIONS, CATEGORY_OPTIONS, COLOR_OPTIONS } from '../../constants/registrationOptions';
import { optionLabel } from '../../i18n/labels';
import { REGISTRATION_RULES } from '../../config/registration';
import {
  getPersonalDataErrors,
  getVehicleErrors,
  getDocumentsErrors,
  hasErrors,
} from '../../utils/registrationErrors';
import { normalizePlate, requiresTechnicalReview } from '../../utils/validators';
import { profileFormFromDriver, buildProfileUpdate } from '../../utils/driverProfile';
import { updateDriverProfile } from '../../services/driverService';
import { goOffline } from '../../services/availabilityService';

// Mañana: los vencimientos deben ser posteriores a hoy.
const tomorrow = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
};

// Devuelve la CLAVE del mensaje (la pantalla lo traduce con t).
function saveErrorKey(error) {
  // Sin internet, fetch lanza TypeError; Firestore usa el código "unavailable".
  if (error instanceof TypeError || error?.code === 'unavailable') return 'common.offlineError';
  if (error?.code === 'photo-upload-failed') return 'editProfile.photoError';
  return 'editProfile.saveError';
}

// Opciones de una lista con el texto en el idioma actual (el valor guardado
// sigue siendo el código).
const translatedOptions = (t, options, group) =>
  options.map((option) => ({ value: option.value, label: optionLabel(t, group, option.value) }));

function EditProfileForm({ user, driver }) {
  const { activeTrip } = useActiveTrip();
  const { t } = useLanguage();
  const [form, setForm] = useState(() => profileFormFromDriver(driver));
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null); // clave del texto del error

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setSaveError(null);
  };

  // Todos los errores del registro: un cambio que va a revisión debe quedar
  // completo y con documentos vigentes (las reglas lo exigen igual que al
  // registrarse). Se muestran de una vez: un documento vencido se ve en rojo.
  const errors = useMemo(
    () => ({ ...getPersonalDataErrors(form), ...getVehicleErrors(form), ...getDocumentsErrors(form) }),
    [form]
  );

  // ¿Cambió algo que requiere aprobación? (antes de subir fotos: una foto nueva
  // es una uri local distinta de la URL guardada).
  const { needsReview } = useMemo(() => buildProfileUpdate(driver, form), [driver, form]);
  const needsTechnicalReview = requiresTechnicalReview(form.year);
  const minimumCapacity = REGISTRATION_RULES.minCapacity[form.category];

  const canSubmit = needsReview && !hasErrors(errors) && !isSaving && !activeTrip;

  const submit = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      // 1) "No disponible" ANTES de perder la aprobación: después las reglas
      //    ya no dejan escribir la ubicación y quedaría Disponible.
      await goOffline(user.uid);
      // 2) Sube las fotos nuevas y guarda con status "pending". No hay que
      //    navegar: el SessionContext ve "pending" y RootNavigator cambia solo
      //    a "Pendiente de aprobación" (esta pantalla se desmonta).
      await updateDriverProfile(user.uid, driver, form);
    } catch (error) {
      console.log('Error al enviar los cambios a revisión:', error?.code, error?.message);
      setSaveError(saveErrorKey(error));
      setIsSaving(false);
    }
  };

  // Confirmación antes de enviar: la consecuencia (quedar sin viajes) es seria.
  const handleSubmit = () => {
    if (!canSubmit) return;
    Alert.alert(t('editProfile.confirmTitle'), t('editProfile.confirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('editProfile.confirm'), style: 'destructive', onPress: submit },
    ]);
  };

  return (
    <ScrollView
      style={formStyles.screen}
      contentContainerStyle={formStyles.container}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
    >
      <Text style={styles.notice}>{t('editProfile.notice')}</Text>

      <Text style={styles.sectionTitle}>{t('editProfile.identity')}</Text>
      <PhotoField
        label={t('fields.profilePhoto')}
        value={form.profilePhoto}
        onChange={(uri) => setField('profilePhoto', uri)}
        error={errors.profilePhoto}
      />
      <TextField
        label={t('fields.fullName')}
        value={form.fullName}
        onChangeText={(text) => setField('fullName', text)}
        error={errors.fullName}
        maxLength={REGISTRATION_RULES.maxNameLength}
        autoCapitalize="words"
        autoComplete="name"
      />
      <SelectField
        label={t('fields.gender')}
        value={form.gender}
        options={translatedOptions(t, GENDER_OPTIONS, 'gender')}
        onChange={(value) => setField('gender', value)}
        error={errors.gender}
      />

      <Text style={styles.sectionTitle}>{t('profile.vehicle')}</Text>
      <SelectField
        label={t('fields.category')}
        value={form.category}
        options={translatedOptions(t, CATEGORY_OPTIONS, 'category')}
        onChange={(value) => setField('category', value)}
        error={errors.category}
      />
      {/* Igual que en el registro: mayúsculas ANTES de validar. */}
      <TextField
        label={t('fields.plate')}
        value={form.plate}
        onChangeText={(text) => setField('plate', normalizePlate(text))}
        error={errors.plate}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={6}
      />
      <TextField
        label={t('fields.brand')}
        value={form.brand}
        onChangeText={(text) => setField('brand', text)}
        error={errors.brand}
        maxLength={REGISTRATION_RULES.maxBrandModelLength}
        autoCapitalize="words"
      />
      <TextField
        label={t('fields.model')}
        value={form.model}
        onChangeText={(text) => setField('model', text)}
        error={errors.model}
        maxLength={REGISTRATION_RULES.maxBrandModelLength}
        autoCapitalize="words"
      />
      <TextField
        label={t('fields.year')}
        value={form.year}
        onChangeText={(text) => setField('year', text)}
        error={errors.year}
        keyboardType="number-pad"
        maxLength={4}
      />
      <SelectField
        label={t('fields.color')}
        value={form.color}
        options={translatedOptions(t, COLOR_OPTIONS, 'color')}
        onChange={(value) => setField('color', value)}
        error={errors.color}
      />
      <TextField
        label={t('editProfile.capacity')}
        value={form.capacity}
        onChangeText={(text) => setField('capacity', text)}
        error={errors.capacity}
        hint={
          minimumCapacity === undefined
            ? undefined
            : t('editProfile.capacityHint', {
                min: minimumCapacity,
                category: optionLabel(t, 'category', form.category),
              })
        }
        keyboardType="number-pad"
        maxLength={2}
      />
      <PhotoField
        label={t('fields.vehiclePhoto')}
        hint={t('editProfile.vehiclePhotoHint')}
        value={form.vehiclePhoto}
        onChange={(uri) => setField('vehiclePhoto', uri)}
        error={errors.vehiclePhoto}
      />

      <Text style={styles.sectionTitle}>{t('profile.documents')}</Text>
      <TextField
        label={t('editProfile.licenseNumber')}
        value={form.licenseNumber}
        onChangeText={(text) => setField('licenseNumber', text)}
        error={errors.licenseNumber}
        keyboardType="number-pad"
        maxLength={10}
      />
      <DateField
        label={t('editProfile.licenseExpiry')}
        value={form.licenseExpiry}
        onChange={(date) => setField('licenseExpiry', date)}
        error={errors.licenseExpiry}
        defaultDate={tomorrow()}
        minimumDate={tomorrow()}
      />
      <PhotoField
        label={t('editProfile.licensePhoto')}
        value={form.licensePhoto}
        onChange={(uri) => setField('licensePhoto', uri)}
        error={errors.licensePhoto}
      />
      <DateField
        label={t('editProfile.soatExpiry')}
        value={form.soatExpiry}
        onChange={(date) => setField('soatExpiry', date)}
        error={errors.soatExpiry}
        defaultDate={tomorrow()}
        minimumDate={tomorrow()}
      />
      <PhotoField
        label={t('editProfile.soatPhoto')}
        value={form.soatPhoto}
        onChange={(uri) => setField('soatPhoto', uri)}
        error={errors.soatPhoto}
      />
      {needsTechnicalReview ? (
        <>
          <DateField
            label={t('editProfile.technicalReviewExpiry')}
            value={form.technicalReviewExpiry}
            onChange={(date) => setField('technicalReviewExpiry', date)}
            error={errors.technicalReviewExpiry}
            defaultDate={tomorrow()}
            minimumDate={tomorrow()}
          />
          <PhotoField
            label={t('editProfile.technicalReviewPhoto')}
            value={form.technicalReviewPhoto}
            onChange={(uri) => setField('technicalReviewPhoto', uri)}
            error={errors.technicalReviewPhoto}
          />
        </>
      ) : (
        <Text style={formStyles.hint}>
          {t('editProfile.technicalReviewNotNeeded', { years: REGISTRATION_RULES.technicalReviewAfterYears })}
        </Text>
      )}

      {activeTrip ? (
        <Text style={[formStyles.errorText, styles.center]}>{t('editProfile.activeTrip')}</Text>
      ) : null}
      {saveError ? (
        <Text style={[formStyles.errorText, styles.center]} accessibilityLiveRegion="polite">
          {t(saveError)}
        </Text>
      ) : null}

      <Pressable
        style={[formStyles.primaryButton, !canSubmit && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!canSubmit}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSubmit }}
      >
        {isSaving ? (
          <ActivityIndicator color="#FFFFFF" accessibilityLabel={t('editProfile.submitting')} />
        ) : (
          <Text style={formStyles.primaryButtonText}>{t('editProfile.submit')}</Text>
        )}
      </Pressable>
      {!needsReview && !isSaving ? (
        <Text style={[formStyles.hint, styles.center]}>{t('editProfile.noChanges')}</Text>
      ) : null}
    </ScrollView>
  );
}

export default function EditProfileScreen() {
  const { user, driver } = useSession();

  if (!user || !driver) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <EditProfileForm user={user} driver={driver} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notice: {
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    color: '#92400E',
    backgroundColor: '#FEF3C7',
  },
  sectionTitle: {
    marginTop: 24,
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  center: {
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});
