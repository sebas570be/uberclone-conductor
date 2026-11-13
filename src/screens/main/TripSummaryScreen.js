// src/screens/main/TripSummaryScreen.js
// Cobro y resumen (enunciado §3, S4): tarifa, comisión, ganancia del conductor
// y estado del pago. Escucha el viaje en tiempo real: cuando se cobra (botón
// "Recibí el efectivo" aquí, o Mercado Pago desde el backend) la pantalla
// cambia sola.
// Mercado Pago: el backend crea el cobro, el checkout se abre dentro de la app
// (expo-web-browser) y al cerrarlo se le pide al backend que lo verifique.
// Se puede salir sin cobrar, con aviso: el viaje queda en "completed" (por
// cobrar) y el conductor puede seguir trabajando.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import { TRIP_STATUS, PAYMENT_STATUS } from '../../config/tripRequest';
import { subscribeToTrip, collectCash } from '../../services/tripService';
import { startMercadoPagoPayment, verifyMercadoPagoPayment } from '../../services/paymentService';
import { getPaymentErrorMessage, getVerifyMessage } from '../../utils/paymentRequest';
import { parseTripSummary, formatCop, paymentMethodLabel, paymentStatusLabel } from '../../utils/tripRequestData';

function DetailRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

// Mensaje para el conductor si el cobro en efectivo falla.
// permission-denied: las reglas lo negaron (el viaje ya no está "completed").
function getCashErrorMessage(error) {
  if (error?.code === 'permission-denied') {
    return 'No se pudo registrar el cobro: el estado del viaje ya cambió.';
  }
  return 'No se pudo registrar el cobro. Revisa tu conexión e inténtalo de nuevo.';
}

export default function TripSummaryScreen({ route, navigation }) {
  const { tripId } = route.params;
  const [trip, setTrip] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  // useRef: evita dos cobros a la vez (doble toque) sin esperar a que se
  // vuelva a dibujar la pantalla.
  const isBusyRef = useRef(false);

  // Viaje en tiempo real. Los datos se revisan con parseTripSummary antes de
  // mostrarlos: si no cuadran, se muestra un error en vez de romper la app.
  // CLEANUP: dejar de escuchar al salir de la pantalla.
  useEffect(() => {
    const unsubscribe = subscribeToTrip(
      tripId,
      (tripDocument) => {
        setTrip(tripDocument ? parseTripSummary(tripDocument.id, tripDocument.data) : null);
        setIsLoading(false);
      },
      (error) => {
        console.log('No se pudo escuchar el viaje:', error?.code);
        setTrip(null);
        setIsLoading(false);
      }
    );
    return () => {
      unsubscribe();
    };
  }, [tripId]);

  // OJO: Firestore muestra "paid" en el celular ANTES de que el servidor
  // confirme (compensación de latencia). Mientras se envía, todavía no se
  // considera pagado: si las reglas lo rechazan, el viaje vuelve a "completed".
  const isPaid = trip?.status === TRIP_STATUS.PAID && !isSending;

  // Salir sin cobrar: se permite, pero primero se avisa.
  usePreventRemove(Boolean(trip) && !isPaid, ({ data }) => {
    Alert.alert('Viaje sin cobrar', 'Este viaje queda pendiente de cobro. ¿Quieres salir?', [
      { text: 'Quedarme', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });

  // "Recibí el efectivo": se confirma antes de enviar (no se puede deshacer).
  // useCallback: no se recrea en cada render.
  const handleCollectCash = useCallback(() => {
    Alert.alert('Cobrar en efectivo', `¿Recibiste ${formatCop(trip.fare)} en efectivo?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, lo recibí',
        onPress: async () => {
          setIsSending(true);
          setErrorMessage('');
          try {
            await collectCash(trip.id);
          } catch (error) {
            setErrorMessage(getCashErrorMessage(error));
          } finally {
            setIsSending(false);
          }
        },
      },
    ]);
  }, [trip]);

  // Ejecuta una acción de Mercado Pago mostrando carga y error, una a la vez.
  const runPaymentAction = useCallback(async (action) => {
    if (isBusyRef.current) return;
    isBusyRef.current = true;
    setIsSending(true);
    setErrorMessage('');
    setInfoMessage('');
    try {
      await action();
    } catch (error) {
      setErrorMessage(getPaymentErrorMessage(error));
    } finally {
      isBusyRef.current = false;
      setIsSending(false);
    }
  }, []);

  // Preguntar al backend cómo va el pago. Si está aprobado, el backend marca
  // el viaje como pagado y esta pantalla cambia sola (onSnapshot).
  const verifyPayment = useCallback(async () => {
    const paymentStatus = await verifyMercadoPagoPayment(trip.id);
    setInfoMessage(getVerifyMessage(paymentStatus));
  }, [trip]);

  // "Cobrar con Mercado Pago": el backend crea el cobro y la app abre el
  // checkout. En iOS openBrowserAsync termina cuando se cierra el navegador:
  // ahí se verifica solo. En Android termina apenas se abre ('opened'): se
  // verifica con el botón "Verificar pago".
  const handlePayWithMercadoPago = useCallback(() => {
    runPaymentAction(async () => {
      const checkoutUrl = await startMercadoPagoPayment(trip.id);
      const result = await WebBrowser.openBrowserAsync(checkoutUrl);
      if (result.type !== WebBrowser.WebBrowserResultType.OPENED) await verifyPayment();
    });
  }, [trip, runPaymentAction, verifyPayment]);

  const handleVerifyPayment = useCallback(() => {
    runPaymentAction(verifyPayment);
  }, [runPaymentAction, verifyPayment]);

  const handleGoHome = useCallback(() => {
    navigation.popToTop();
  }, [navigation]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>No se pudo cargar el resumen de este viaje.</Text>
        <Pressable style={[styles.button, styles.primaryButton]} onPress={handleGoHome} accessibilityRole="button">
          <Text style={styles.primaryText}>Volver al inicio</Text>
        </Pressable>
      </View>
    );
  }

  const canCollectCash = trip.paymentMethod === 'cash' && trip.status === TRIP_STATUS.COMPLETED;
  const canPayWithMercadoPago = trip.paymentMethod === 'mercadopago' && trip.status === TRIP_STATUS.COMPLETED;
  // Ya se creó el cobro (el backend dejó paymentStatus en pending): se puede verificar.
  const canVerify = canPayWithMercadoPago && trip.paymentStatus === PAYMENT_STATUS.PENDING;
  const commissionLabel =
    trip.commissionRate === null ? 'Comisión' : `Comisión (${Math.round(trip.commissionRate * 100)} %)`;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View
        style={[styles.banner, isPaid ? styles.bannerPaid : styles.bannerPending]}
        accessibilityRole="header"
      >
        <Text style={[styles.bannerText, isPaid ? styles.bannerTextPaid : styles.bannerTextPending]}>
          {isPaid ? 'Viaje pagado' : 'Viaje por cobrar'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Recogida</Text>
        <Text style={styles.address}>{trip.origin.address}</Text>
        <Text style={[styles.sectionTitle, styles.spaced]}>Destino</Text>
        <Text style={styles.address}>{trip.destination.address}</Text>
      </View>

      <View style={styles.card}>
        <DetailRow label="Distancia" value={`${trip.distanceKm} km`} />
        <DetailRow label="Duración" value={`${trip.durationMin} min`} />
        <DetailRow label="Método de pago" value={paymentMethodLabel(trip.paymentMethod)} />
        <DetailRow label="Estado del pago" value={paymentStatusLabel(trip.paymentStatus)} />
      </View>

      <View style={styles.card}>
        <DetailRow label="Tarifa" value={formatCop(trip.fare)} />
        <DetailRow label={commissionLabel} value={`- ${formatCop(trip.commission)}`} />
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.earningsLabel}>Tu ganancia</Text>
          <Text style={styles.earningsValue}>{formatCop(trip.driverEarnings)}</Text>
        </View>
      </View>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      {infoMessage ? <Text style={styles.info}>{infoMessage}</Text> : null}

      {canCollectCash ? (
        <Pressable
          style={[styles.button, styles.primaryButton, isSending && styles.disabled]}
          onPress={handleCollectCash}
          disabled={isSending}
          accessibilityRole="button"
          accessibilityLabel={`Recibí el efectivo, ${formatCop(trip.fare)}`}
        >
          {isSending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Recibí el efectivo</Text>}
        </Pressable>
      ) : null}

      {canPayWithMercadoPago ? (
        <Pressable
          style={[styles.button, styles.primaryButton, isSending && styles.disabled]}
          onPress={handlePayWithMercadoPago}
          disabled={isSending}
          accessibilityRole="button"
          accessibilityLabel={`Cobrar con Mercado Pago, ${formatCop(trip.fare)}`}
        >
          {isSending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Cobrar con Mercado Pago</Text>}
        </Pressable>
      ) : null}

      {canVerify ? (
        <Pressable
          style={[styles.button, styles.secondaryButton, isSending && styles.disabled]}
          onPress={handleVerifyPayment}
          disabled={isSending}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryText}>Verificar pago</Text>
        </Pressable>
      ) : null}

      <Pressable
        style={[styles.button, styles.secondaryButton, isSending && styles.disabled]}
        onPress={handleGoHome}
        disabled={isSending}
        accessibilityRole="button"
      >
        <Text style={styles.secondaryText}>Volver al inicio</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#F3F4F6',
    flexGrow: 1,
  },
  center: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    padding: 16,
  },
  banner: {
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  bannerPaid: {
    backgroundColor: '#DCFCE7',
  },
  bannerPending: {
    backgroundColor: '#FEF3C7',
  },
  bannerText: {
    fontSize: 18,
    fontWeight: '700',
  },
  bannerTextPaid: {
    color: '#15803D',
  },
  bannerTextPending: {
    color: '#92400E',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  spaced: {
    marginTop: 12,
  },
  address: {
    marginTop: 4,
    fontSize: 16,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rowLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 6,
  },
  earningsLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  earningsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#15803D',
  },
  error: {
    marginBottom: 12,
    fontSize: 14,
    textAlign: 'center',
    color: '#DC2626',
  },
  info: {
    marginBottom: 12,
    fontSize: 14,
    textAlign: 'center',
    color: '#92400E',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 12,
    borderRadius: 10,
  },
  primaryButton: {
    backgroundColor: '#111827',
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#111827',
    backgroundColor: '#FFFFFF',
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  disabled: {
    opacity: 0.5,
  },
});
