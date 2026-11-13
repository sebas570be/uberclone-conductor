// src/screens/main/ProfileScreen.js
// Perfil (enunciado §3.7): los datos del conductor, su vehículo y sus
// documentos. Se editan directo el celular y el correo de Mercado Pago (no se
// comparan con ningún documento). Los datos salen del SessionContext, que ya
// escucha drivers/{uid} en tiempo real.
import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, Image, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import TextField from '../../components/TextField';
import { formStyles } from '../../components/formStyles';
import useSession from '../../hooks/useSession';
import { GENDER_OPTIONS, CATEGORY_OPTIONS, COLOR_OPTIONS, labelFor } from '../../constants/registrationOptions';
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
function ExpiryRow({ label, date }) {
  if (!date) return <InfoRow label={label} value="No aplica" />;
  const isExpired = !isFutureDate(date);
  return <InfoRow label={label} value={`${formatDate(date)}${isExpired ? ' · Vencido' : ''}`} isWarning={isExpired} />;
}

function saveErrorMessage(error) {
  // Sin internet, fetch lanza TypeError; Firestore usa el código "unavailable".
  if (error instanceof TypeError || error?.code === 'unavailable') {
    return 'Sin conexión. Revisa tu internet e intenta de nuevo.';
  }
  return 'No se pudieron guardar los cambios. Intenta de nuevo.';
}

// El formulario se monta solo cuando ya están los datos del conductor: así el
// estado inicial (useState) siempre parte del documento guardado.
function ProfileForm({ user, driver }) {
  const [form, setForm] = useState(() => profileFormFromDriver(driver));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null); // { text, isError }

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
      setMessage({ text: 'Cambios guardados.', isError: false });
    } catch (error) {
      console.log('Error al guardar el perfil:', error?.code, error?.message);
      setMessage({ text: saveErrorMessage(error), isError: true });
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
        <Image source={{ uri: personal.photoUrl }} style={styles.avatar} accessibilityLabel="Foto de perfil" />
        <Text style={styles.name}>{personal.fullName}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <Text style={styles.sectionTitle}>Datos personales</Text>
      <View style={styles.card}>
        <InfoRow label="Documento" value={personal.documentNumber} />
        <InfoRow label="Fecha de nacimiento" value={formatDate(form.birthDate)} />
        <InfoRow label="Género" value={labelFor(GENDER_OPTIONS, personal.gender)} />
        <TextField
          label="Celular"
          value={form.phone}
          onChangeText={(text) => setField('phone', text)}
          error={errors.phone}
          keyboardType="number-pad"
          maxLength={10}
          autoComplete="tel"
        />
      </View>

      <Text style={styles.sectionTitle}>Vehículo</Text>
      <View style={styles.card}>
        <Image source={{ uri: vehicle.photoUrl }} style={styles.vehiclePhoto} accessibilityLabel="Foto del vehículo" />
        <InfoRow label="Categoría" value={labelFor(CATEGORY_OPTIONS, vehicle.category)} />
        <InfoRow label="Placa" value={vehicle.plate} />
        <InfoRow label="Marca y modelo" value={`${vehicle.brand} ${vehicle.model}`} />
        <InfoRow label="Año" value={String(vehicle.year)} />
        <InfoRow label="Color" value={labelFor(COLOR_OPTIONS, vehicle.color)} />
        <InfoRow label="Capacidad" value={`${vehicle.capacity} pasajeros`} />
      </View>

      <Text style={styles.sectionTitle}>Documentos</Text>
      <View style={styles.card}>
        <InfoRow label="Licencia" value={documents.licenseNumber} />
        <ExpiryRow label="Vence la licencia" date={form.licenseExpiry} />
        <ExpiryRow label="Vence el SOAT" date={form.soatExpiry} />
        <ExpiryRow label="Vence la revisión técnico-mecánica" date={form.technicalReviewExpiry} />
      </View>

      <Text style={styles.sectionTitle}>Pagos</Text>
      <View style={styles.card}>
        <TextField
          label="Correo de Mercado Pago"
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
          {message.text}
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
          <Text style={formStyles.primaryButtonText}>Guardar cambios</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

export default function ProfileScreen() {
  const { user, driver } = useSession();

  if (!user || !driver) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <ProfileForm user={user} driver={driver} />;
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
});
