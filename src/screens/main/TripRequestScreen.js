// src/screens/main/TripRequestScreen.js
// Solicitud entrante (enunciado §3, S2): origen, destino, distancia, duración,
// categoría, método de pago, tarifa y ganancia neta ESTIMADAS (con
// calculateFare, la misma función del cobro final), temporizador de 15 s y
// botones Aceptar / Rechazar. Al llegar a 0 se rechaza sola.
// AI-assisted: see docs/AI_LOG.md #11
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { calculateFare } from '../../utils/calculateFare';
import { getSecondsLeft, formatCop, paymentMethodLabel } from '../../utils/tripRequestData';
import { CATEGORY_OPTIONS, labelFor } from '../../constants/registrationOptions';
import { TRIP_STATUS } from '../../config/tripRequest';
import { respondToTrip, getTripErrorMessage } from '../../services/tripService';

function DetailRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function TripRequestScreen({ route, navigation }) {
  const { trip } = route.params;

  // useMemo: la estimación solo se recalcula si cambia el viaje (no cada segundo
  // que el temporizador vuelve a dibujar la pantalla).
  const estimate = useMemo(
    () => calculateFare({ distanceKm: trip.distanceKm, durationMin: trip.durationMin, category: trip.category }),
    [trip.distanceKm, trip.durationMin, trip.category]
  );

  const [secondsLeft, setSecondsLeft] = useState(() => getSecondsLeft(trip.createdAtMs, Date.now()));
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isClosed, setIsClosed] = useState(false); // ya no se puede responder
  // useRef: evita responder dos veces (doble toque, o el rechazo automático
  // justo después de tocar Aceptar) sin esperar a que se vuelva a dibujar.
  const hasRespondedRef = useRef(false);

  // useCallback: aceptar y rechazar no se recrean en cada segundo del temporizador.
  const respond = useCallback(
    async (status) => {
      if (hasRespondedRef.current) return;
      hasRespondedRef.current = true;
      setIsSending(true);
      setErrorMessage('');
      try {
        await respondToTrip(trip.id, status);
        if (status === TRIP_STATUS.ACCEPTED) {
          // replace: "atrás" no debe volver a una solicitud ya aceptada.
          navigation.replace('TripInProgress', { tripId: trip.id });
        } else {
          navigation.goBack();
        }
      } catch (error) {
        setIsSending(false);
        setErrorMessage(getTripErrorMessage(error));
        if (error?.code === 'permission-denied') {
          // Las reglas la negaron (venció o ya no está en "requested"): no se reintenta.
          setIsClosed(true);
        } else {
          hasRespondedRef.current = false; // error de red: puede volver a intentarlo
        }
      }
    },
    [trip.id, navigation]
  );

  const handleAccept = useCallback(() => respond(TRIP_STATUS.ACCEPTED), [respond]);
  const handleReject = useCallback(() => respond(TRIP_STATUS.REJECTED), [respond]);

  // Temporizador: cada segundo recalcula lo que queda desde createdAt.
  // CLEANUP: se detiene al salir de la pantalla (aceptar, rechazar o desmontar).
  useEffect(() => {
    const intervalId = setInterval(() => {
      const left = getSecondsLeft(trip.createdAtMs, Date.now());
      setSecondsLeft(left);
      if (left === 0) clearInterval(intervalId);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [trip.createdAtMs]);

  // En 0: rechazo automático (si no respondió antes).
  useEffect(() => {
    if (secondsLeft === 0) respond(TRIP_STATUS.REJECTED);
  }, [secondsLeft, respond]);

  const canRespond = !isSending && !isClosed && secondsLeft > 0;
  const isUrgent = secondsLeft <= 5;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.timer, isUrgent && styles.timerUrgent]}>
        <Text
          style={[styles.timerNumber, isUrgent && styles.timerNumberUrgent]}
          accessibilityLabel={`Quedan ${secondsLeft} segundos para responder`}
        >
          {secondsLeft}
        </Text>
        <Text style={styles.timerLabel}>segundos</Text>
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
        <DetailRow label="Categoría" value={labelFor(CATEGORY_OPTIONS, trip.category)} />
        <DetailRow label="Método de pago" value={paymentMethodLabel(trip.paymentMethod)} />
      </View>

      <View style={styles.card}>
        <DetailRow label="Tarifa estimada" value={formatCop(estimate.fare)} />
        <DetailRow
          label={`Comisión (${Math.round(estimate.commissionRate * 100)} %)`}
          value={`- ${formatCop(estimate.commission)}`}
        />
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.earningsLabel}>Tu ganancia estimada</Text>
          <Text style={styles.earningsValue}>{formatCop(estimate.driverEarnings)}</Text>
        </View>
      </View>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      {isClosed ? (
        <Pressable
          style={[styles.button, styles.acceptButton]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
        >
          <Text style={styles.acceptText}>Volver al inicio</Text>
        </Pressable>
      ) : (
        <View style={styles.buttons}>
          <Pressable
            style={[styles.button, styles.rejectButton, !canRespond && styles.disabled]}
            onPress={handleReject}
            disabled={!canRespond}
            accessibilityRole="button"
            accessibilityLabel="Rechazar solicitud"
          >
            <Text style={styles.rejectText}>Rechazar</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.acceptButton, !canRespond && styles.disabled]}
            onPress={handleAccept}
            disabled={!canRespond}
            accessibilityRole="button"
            accessibilityLabel="Aceptar solicitud"
          >
            {isSending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.acceptText}>Aceptar</Text>}
          </Pressable>
        </View>
      )}
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
  timer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#111827',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  timerUrgent: {
    borderColor: '#DC2626',
  },
  timerNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  timerNumberUrgent: {
    color: '#DC2626',
  },
  timerLabel: {
    fontSize: 12,
    color: '#6B7280',
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
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 10,
  },
  rejectButton: {
    borderWidth: 2,
    borderColor: '#111827',
    backgroundColor: '#FFFFFF',
  },
  acceptButton: {
    backgroundColor: '#111827',
  },
  disabled: {
    opacity: 0.5,
  },
  rejectText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  acceptText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
