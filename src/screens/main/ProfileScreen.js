// src/screens/main/ProfileScreen.js
// Perfil (enunciado §3.7): los datos del conductor, su vehículo y sus
// documentos. Se editan directo el celular y el correo de Mercado Pago (no se
// comparan con ningún documento). La identidad, el vehículo y los documentos se
// editan en EditProfileScreen (requieren una nueva aprobación). Los datos salen
// del SessionContext, que ya escucha drivers/{uid} en tiempo real.
// Textos en el idioma elegido (useLanguage). Los mensajes de validación todavía
// salen de registrationErrors (se traducen con el registro).
import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, Image, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import TextField from '../../components/TextField';
import { formStyles } from '../../components/formStyles';
import useSession from '../../hooks/useSession';
import useLanguage from '../../hooks/useLanguage';
import { optionLabel } from '../../i18n/labels';
import { getPersonalDataErrors, getDocumentsErrors } from '../../utils/registrationErrors';
import { isFutureDate } from '../../utils/validators';
import { profileFormFromDriver, buildProfileUpdate } from '../../utils/driverProfile';
import { formatDate } from '../../utils/dates';
import { updateDriverProfile } from '../../services/driverService';

function InfoRow({ label, value, isWarning = false }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, isWarning && styles.warning]}>{value}</Text>
    </View>
  );
}

// Fecha de vencimiento; si ya pasó, se avisa en rojo.
function ExpiryRow({ label, date, t }) {
  if (!date) return <InfoRow label={label} value={t('profile.notApplicable')} />;
  const isExpired = !isFutureDate(date);
  const value = isExpired ? `${formatDate(date)} · ${t('profile.expired')}` : formatDate(date);
  return <InfoRow label={label} value={value} isWarning={isExpired} />;
}

// Devuelve la CLAVE del mensaje (la pantalla lo traduce con t).
function saveErrorKey(error) {
  // Sin internet, fetch lanza TypeError; Firestore usa el código "unavailable".
  if (error instanceof TypeError || error?.code === 'unavailable') return 'common.offlineError';
  return 'profile.saveError';
}

// El formulario se monta solo cuando ya están los datos del conductor: así el
// estado inicial (useState) siempre parte del documento guardado.
function ProfileForm({ user, driver, onEdit }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(() => profileFormFromDriver(driver));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null); // { key, isError }: key = clave del texto

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setMessage(null);
  };

  // Solo se validan los dos campos que se editan aquí: un SOAT vencido no debe
  // impedir cambiar el celular. Los mensajes son los mismos del registro.
  // Empiezan válidos (vienen del registro), así que el error se muestra en
  // cuanto el conductor escribe algo inválido.
  const errors = useMemo(
    () => ({
      phone: getPersonalDataErrors(form).phone,
      mercadoPagoEmail: getDocumentsErrors(form).mercadoPagoEmail,
    }),
    [form]
  );

  // ¿Cambió algo respecto a lo guardado? (useMemo: se compara solo si cambian
  // el formulario o el documento).
  const { changedFields } = useMemo(() => buildProfileUpdate(driver, form), [driver, form]);
  const canSave = changedFields.length > 0 && !errors.phone && !errors.mercadoPagoEmail && !isSaving;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    setMessage(null);
    try {
      await updateDriverProfile(user.uid, driver, form);
      setMessage({ key: 'profile.saved', isError: false });
    } catch (error) {
      console.log('Error al guardar el perfil:', error?.code, error?.message);
      setMessage({ key: saveErrorKey(error), isError: true });
    } finally {
      setIsSaving(false);
    }
  };

  const { personal, vehicle, documents } = driver;

  return (
    <ScrollView
      style={formStyles.screen}
      contentContainerStyle={formStyles.container}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
    >
      <View style={styles.header}>
        <Image source={{ uri: personal.photoUrl }} style={styles.avatar} accessibilityLabel={t('fields.profilePhoto')} />
        <Text style={styles.name}>{personal.fullName}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <Text style={styles.sectionTitle}>{t('profile.personalData')}</Text>
      <View style={styles.card}>
        <InfoRow label={t('fields.documentNumber')} value={personal.documentNumber} />
        <InfoRow label={t('fields.birthDate')} value={formatDate(form.birthDate)} />
        <InfoRow label={t('fields.gender')} value={optionLabel(t, 'gender', personal.gender)} />
        <TextField
          label={t('fields.phone')}
          value={form.phone}
          onChangeText={(text) => setField('phone', text)}
          error={errors.phone}
          keyboardType="number-pad"
          maxLength={10}
          autoComplete="tel"
        />
      </View>

      <Text style={styles.sectionTitle}>{t('profile.vehicle')}</Text>
      <View style={styles.card}>
        <Image
          source={{ uri: vehicle.photoUrl }}
          style={styles.vehiclePhoto}
          accessibilityLabel={t('fields.vehiclePhoto')}
        />
        <InfoRow label={t('fields.category')} value={optionLabel(t, 'category', vehicle.category)} />
        <InfoRow label={t('fields.plate')} value={vehicle.plate} />
        <InfoRow label={t('profile.brandModel')} value={`${vehicle.brand} ${vehicle.model}`} />
        <InfoRow label={t('fields.year')} value={String(vehicle.year)} />
        <InfoRow label={t('fields.color')} value={optionLabel(t, 'color', vehicle.color)} />
        <InfoRow label={t('profile.capacity')} value={t('profile.passengers', { count: vehicle.capacity })} />
      </View>

      <Text style={styles.sectionTitle}>{t('profile.documents')}</Text>
      <View style={styles.card}>
        <InfoRow label={t('profile.license')} value={documents.licenseNumber} />
        <ExpiryRow label={t('profile.licenseExpiry')} date={form.licenseExpiry} t={t} />
        <ExpiryRow label={t('profile.soatExpiry')} date={form.soatExpiry} t={t} />
        <ExpiryRow label={t('profile.technicalReviewExpiry')} date={form.technicalReviewExpiry} t={t} />
      </View>

      <Text style={styles.sectionTitle}>{t('profile.payments')}</Text>
      <View style={styles.card}>
        <TextField
          label={t('fields.mercadoPagoEmail')}
          value={form.mercadoPagoEmail}
          onChangeText={(text) => setField('mercadoPagoEmail', text)}
          error={errors.mercadoPagoEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
      </View>

      {message ? (
        <Text style={[styles.message, message.isError && styles.warning]} accessibilityLiveRegion="polite">
          {t(message.key)}
        </Text>
      ) : null}

      <Pressable
        style={[formStyles.primaryButton, !canSave && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={!canSave}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSave }}
      >
        {isSaving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={formStyles.primaryButtonText}>{t('profile.save')}</Text>
        )}
      </Pressable>

      <Pressable style={formStyles.secondaryButton} onPress={onEdit} accessibilityRole="button">
        <Text style={formStyles.secondaryButtonText}>{t('profile.edit')}</Text>
      </Pressable>
      <Text style={[formStyles.hint, styles.editHint]}>{t('profile.editHint')}</Text>
    </ScrollView>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user, driver } = useSession();

  if (!user || !driver) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <ProfileForm user={user} driver={driver} onEdit={() => navigation.navigate('EditProfile')} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
  },
  name: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  email: {
    marginTop: 2,
    fontSize: 14,
    color: '#6B7280',
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  card: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    gap: 12,
  },
  rowLabel: {
    flexShrink: 1,
    fontSize: 15,
    color: '#6B7280',
  },
  rowValue: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
  },
  warning: {
    color: '#DC2626',
  },
  vehiclePhoto: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
    color: '#15803D',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  editHint: {
    textAlign: 'center',
  },
});
