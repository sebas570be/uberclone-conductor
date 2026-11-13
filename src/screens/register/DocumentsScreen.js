// src/screens/register/DocumentsScreen.js
// Pestaña 3 del registro: documentos y pagos (enunciado §2) y el botón
// "Enviar registro", que guarda todo en Firestore con estado "pending".
// El botón está deshabilitado hasta que las 3 pestañas estén completas y válidas.
// Las fotos se suben a Cloudinary al tocar "Enviar registro" (ver driverService).
// Textos en el idioma elegido (useLanguage).
import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import TextField from '../../components/TextField';
import DateField from '../../components/DateField';
import CheckboxField from '../../components/CheckboxField';
import PhotoField from '../../components/PhotoField';
import { formStyles } from '../../components/formStyles';
import useRegistration from '../../hooks/useRegistration';
import useSession from '../../hooks/useSession';
import useLanguage from '../../hooks/useLanguage';
import { PRICING } from '../../config/pricing';
import { REGISTRATION_RULES } from '../../config/registration';
import { hasErrors } from '../../utils/registrationErrors';
import { requiresTechnicalReview } from '../../utils/validators';
import { submitRegistration } from '../../services/driverService';

// Mañana: los vencimientos deben ser posteriores a hoy, así el selector no
// deja elegir una fecha vencida.
const tomorrow = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
};

// Clave del mensaje si el envío falla. Sin internet, fetch lanza TypeError.
const SUBMIT_ERROR_KEYS = Object.freeze({
  'permission-denied': 'register.permissionDenied',
  unavailable: 'common.offlineError',
  'photo-upload-failed': 'editProfile.photoError',
});
function submitErrorKey(error) {
  if (error instanceof TypeError) return 'common.offlineError';
  return SUBMIT_ERROR_KEYS[error?.code] ?? 'register.submitError';
}

export default function DocumentsScreen({ navigation }) {
  const { user } = useSession();
  const { t } = useLanguage();
  const { form, touched, personalDataErrors, vehicleErrors, documentsErrors, setField, touchFields } =
    useRegistration();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null); // clave del texto del error
  // Detalle técnico del error: solo se muestra en desarrollo (__DEV__), nunca en la APK.
  const [submitDetail, setSubmitDetail] = useState(null);

  const errorFor = (name) => (touched[name] ? documentsErrors[name] : undefined);
  const touch = (name) => () => touchFields([name]);

  const needsTechnicalReview = requiresTechnicalReview(form.year);
  // El % sale de pricing.js: si cambia la comisión, cambia este texto solo.
  const commissionPercent = Math.round(PRICING.commissionRate * 100);

  // Enunciado: "Enviar registro" deshabilitado hasta que las 3 pestañas estén completas.
  const canSubmit =
    !hasErrors(personalDataErrors) && !hasErrors(vehicleErrors) && !hasErrors(documentsErrors) && !isSubmitting;

  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitDetail(null);
    setIsSubmitting(true);
    try {
      // Al guardarse, el SessionContext ve el documento y la app pasa sola a
      // "Pendiente de aprobación": no hay que navegar.
      await submitRegistration(user.uid, user.email, form);
    } catch (error) {
      // Se imprime el código, el tipo y el mensaje: algunos errores no traen código.
      console.log('Error al enviar el registro:', error?.code, error?.name, error?.message);
      setSubmitError(submitErrorKey(error));
      setSubmitDetail(`${error?.name ?? 'Error'} | código: ${error?.code ?? 'sin código'} | ${error?.message ?? ''}`);
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={formStyles.screen}
      contentContainerStyle={formStyles.container}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
    >
      <Text style={formStyles.step}>{t('register.step', { number: 3 })}</Text>

      <TextField
        label={t('editProfile.licenseNumber')}
        value={form.licenseNumber}
        onChangeText={(text) => setField('licenseNumber', text)}
        onBlur={touch('licenseNumber')}
        error={errorFor('licenseNumber')}
        keyboardType="number-pad"
        maxLength={10}
        placeholder={t('register.licensePlaceholder')}
      />

      <DateField
        label={t('editProfile.licenseExpiry')}
        value={form.licenseExpiry}
        onChange={(date) => setField('licenseExpiry', date)}
        onClose={touch('licenseExpiry')}
        error={errorFor('licenseExpiry')}
        defaultDate={tomorrow()}
        minimumDate={tomorrow()}
      />

      <PhotoField
        label={t('editProfile.licensePhoto')}
        value={form.licensePhoto}
        onChange={(uri) => setField('licensePhoto', uri)}
        onClose={touch('licensePhoto')}
        error={errorFor('licensePhoto')}
      />

      <DateField
        label={t('editProfile.soatExpiry')}
        value={form.soatExpiry}
        onChange={(date) => setField('soatExpiry', date)}
        onClose={touch('soatExpiry')}
        error={errorFor('soatExpiry')}
        defaultDate={tomorrow()}
        minimumDate={tomorrow()}
      />

      <PhotoField
        label={t('editProfile.soatPhoto')}
        value={form.soatPhoto}
        onChange={(uri) => setField('soatPhoto', uri)}
        onClose={touch('soatPhoto')}
        error={errorFor('soatPhoto')}
      />

      {needsTechnicalReview ? (
        <>
          <DateField
            label={t('editProfile.technicalReviewExpiry')}
            value={form.technicalReviewExpiry}
            onChange={(date) => setField('technicalReviewExpiry', date)}
            onClose={touch('technicalReviewExpiry')}
            error={errorFor('technicalReviewExpiry')}
            defaultDate={tomorrow()}
            minimumDate={tomorrow()}
          />
          <PhotoField
            label={t('editProfile.technicalReviewPhoto')}
            value={form.technicalReviewPhoto}
            onChange={(uri) => setField('technicalReviewPhoto', uri)}
            onClose={touch('technicalReviewPhoto')}
            error={errorFor('technicalReviewPhoto')}
          />
        </>
      ) : (
        <Text style={[formStyles.hint, styles.notice]}>
          {t('editProfile.technicalReviewNotNeeded', { years: REGISTRATION_RULES.technicalReviewAfterYears })}
        </Text>
      )}

      <TextField
        label={t('fields.mercadoPagoEmail')}
        value={form.mercadoPagoEmail}
        onChangeText={(text) => setField('mercadoPagoEmail', text)}
        onBlur={touch('mercadoPagoEmail')}
        error={errorFor('mercadoPagoEmail')}
        hint={t('register.mercadoPagoHint')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <CheckboxField
        label={t('register.terms', { percent: commissionPercent })}
        checked={form.termsAccepted}
        onChange={(value) => {
          setField('termsAccepted', value);
          touchFields(['termsAccepted']);
        }}
        error={errorFor('termsAccepted')}
      />

      <Pressable
        style={[formStyles.primaryButton, !canSubmit && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!canSubmit}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSubmit }}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" accessibilityLabel={t('register.submitting')} />
        ) : (
          <Text style={formStyles.primaryButtonText}>{t('register.submit')}</Text>
        )}
      </Pressable>

      {isSubmitting ? (
        <Text style={[formStyles.hint, styles.center]}>{t('register.submittingHint')}</Text>
      ) : null}
      {!canSubmit && !isSubmitting ? (
        <Text style={[formStyles.hint, styles.center]}>{t('register.completeAll')}</Text>
      ) : null}
      {submitError ? (
        <View>
          <Text style={[formStyles.errorText, styles.center]} accessibilityLiveRegion="polite">
            {t(submitError)}
          </Text>
          {__DEV__ && submitDetail ? <Text style={[formStyles.hint, styles.center]}>{submitDetail}</Text> : null}
        </View>
      ) : null}

      <Pressable
        style={formStyles.secondaryButton}
        onPress={() => navigation.navigate('Vehicle')}
        disabled={isSubmitting}
        accessibilityRole="button"
      >
        <Text style={formStyles.secondaryButtonText}>{t('register.backVehicle')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  buttonDisabled: {
    opacity: 0.4,
  },
  center: {
    textAlign: 'center',
  },
  notice: {
    marginTop: 16,
  },
});
