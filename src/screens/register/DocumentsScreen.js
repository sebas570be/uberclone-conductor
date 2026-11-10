// src/screens/register/DocumentsScreen.js
// Pestaña 3 del registro: documentos y pagos (enunciado §2) y el botón
// "Enviar registro", que guarda todo en Firestore con estado "pending".
// El botón está deshabilitado hasta que las 3 pestañas estén completas y válidas.
// Las fotos se suben a Cloudinary al tocar "Enviar registro" (ver driverService).
import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import TextField from '../../components/TextField';
import DateField from '../../components/DateField';
import CheckboxField from '../../components/CheckboxField';
import PhotoField from '../../components/PhotoField';
import { formStyles } from '../../components/formStyles';
import useRegistration from '../../hooks/useRegistration';
import useSession from '../../hooks/useSession';
import { PRICING } from '../../config/pricing';
import { REGISTRATION_RULES } from '../../config/registration';
import { hasErrors } from '../../utils/registrationErrors';
import { requiresTechnicalReview } from '../../utils/validators';
import { submitRegistration, getDriverErrorMessage } from '../../services/driverService';

// Mañana: los vencimientos deben ser posteriores a hoy, así el selector no
// deja elegir una fecha vencida.
const tomorrow = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
};

export default function DocumentsScreen({ navigation }) {
  const { user } = useSession();
  const { form, touched, personalDataErrors, vehicleErrors, documentsErrors, setField, touchFields } =
    useRegistration();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
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
      setSubmitError(getDriverErrorMessage(error));
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
      <Text style={formStyles.step}>Paso 3 de 3</Text>

      <TextField
        label="Número de licencia de conducción"
        value={form.licenseNumber}
        onChangeText={(text) => setField('licenseNumber', text)}
        onBlur={touch('licenseNumber')}
        error={errorFor('licenseNumber')}
        keyboardType="number-pad"
        maxLength={10}
        placeholder="Es el mismo número de tu cédula"
      />

      <DateField
        label="Vencimiento de la licencia"
        value={form.licenseExpiry}
        onChange={(date) => setField('licenseExpiry', date)}
        onClose={touch('licenseExpiry')}
        error={errorFor('licenseExpiry')}
        defaultDate={tomorrow()}
        minimumDate={tomorrow()}
      />

      <PhotoField
        label="Foto de la licencia"
        value={form.licensePhoto}
        onChange={(uri) => setField('licensePhoto', uri)}
        onClose={touch('licensePhoto')}
        error={errorFor('licensePhoto')}
      />

      <DateField
        label="Vencimiento del SOAT"
        value={form.soatExpiry}
        onChange={(date) => setField('soatExpiry', date)}
        onClose={touch('soatExpiry')}
        error={errorFor('soatExpiry')}
        defaultDate={tomorrow()}
        minimumDate={tomorrow()}
      />

      <PhotoField
        label="Foto del SOAT"
        value={form.soatPhoto}
        onChange={(uri) => setField('soatPhoto', uri)}
        onClose={touch('soatPhoto')}
        error={errorFor('soatPhoto')}
      />

      {needsTechnicalReview ? (
        <>
          <DateField
            label="Vencimiento de la revisión técnico-mecánica"
            value={form.technicalReviewExpiry}
            onChange={(date) => setField('technicalReviewExpiry', date)}
            onClose={touch('technicalReviewExpiry')}
            error={errorFor('technicalReviewExpiry')}
            defaultDate={tomorrow()}
            minimumDate={tomorrow()}
          />
          <PhotoField
            label="Foto de la revisión técnico-mecánica"
            value={form.technicalReviewPhoto}
            onChange={(uri) => setField('technicalReviewPhoto', uri)}
            onClose={touch('technicalReviewPhoto')}
            error={errorFor('technicalReviewPhoto')}
          />
        </>
      ) : (
        <Text style={[formStyles.hint, styles.notice]}>
          Revisión técnico-mecánica: no aplica, tu vehículo tiene menos de{' '}
          {REGISTRATION_RULES.technicalReviewAfterYears} años.
        </Text>
      )}

      <TextField
        label="Correo de Mercado Pago"
        value={form.mercadoPagoEmail}
        onChangeText={(text) => setField('mercadoPagoEmail', text)}
        onBlur={touch('mercadoPagoEmail')}
        error={errorFor('mercadoPagoEmail')}
        hint="Ahí recibes los pagos. No se piden cuentas bancarias ni tarjetas."
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <CheckboxField
        label={`Acepto los términos y condiciones, incluida una comisión del ${commissionPercent} % por cada viaje.`}
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
          <ActivityIndicator color="#FFFFFF" accessibilityLabel="Subiendo fotos y enviando el registro" />
        ) : (
          <Text style={formStyles.primaryButtonText}>Enviar registro</Text>
        )}
      </Pressable>

      {isSubmitting ? (
        <Text style={[formStyles.hint, styles.center]}>Subiendo las fotos y enviando… puede tardar unos segundos.</Text>
      ) : null}
      {!canSubmit && !isSubmitting ? (
        <Text style={[formStyles.hint, styles.center]}>Completa las 3 pestañas para poder enviar.</Text>
      ) : null}
      {submitError ? (
        <View>
          <Text style={[formStyles.errorText, styles.center]} accessibilityLiveRegion="polite">
            {submitError}
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
        <Text style={formStyles.secondaryButtonText}>Atrás: Vehículo</Text>
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
