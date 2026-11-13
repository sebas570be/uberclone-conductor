// src/screens/main/TripDetailScreen.js
// Detalle de un viaje del historial (enunciado §6 HI4): ruta dibujada con
// Polyline (no Static Maps, A8), duración, distancia, comisión, propina y
// calificación. El viaje sale de la misma escucha del historial
// (useFinishedTrips), así que si cambia (por ejemplo, se paga) se ve aquí.
import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import useFinishedTrips from '../../hooks/useFinishedTrips';
import { decodePolyline } from '../../utils/polyline';
import { historyStatusLabel } from '../../utils/earnings';
import { formatCop, paymentMethodLabel } from '../../utils/tripRequestData';
import { formatDateTime } from '../../utils/dates';
import { CATEGORY_OPTIONS, labelFor } from '../../constants/registrationOptions';

const MAP_PADDING = { top: 40, right: 40, bottom: 40, left: 40 };

function DetailRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function TripDetailScreen({ route }) {
  const { tripId } = route.params;
  const { trips, isLoading } = useFinishedTrips();
  const trip = useMemo(() => trips.find((item) => item.id === tripId) ?? null, [trips, tripId]);
  const mapRef = useRef(null);

  // Puntos de la ruta guardada al crear la solicitud (useMemo: se decodifica
  // una sola vez por viaje).
  const routePoints = useMemo(() => decodePolyline(trip?.routePolyline), [trip?.routePolyline]);

  // Cuando el mapa está listo, se ajusta para que se vea toda la ruta.
  const handleMapReady = useCallback(() => {
    if (routePoints.length > 1) {
      mapRef.current?.fitToCoordinates(routePoints, { edgePadding: MAP_PADDING, animated: false });
    }
  }, [routePoints]);

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
        <Text style={styles.error}>No se encontró este viaje.</Text>
      </View>
    );
  }

  const commissionLabel =
    trip.commissionRate === null ? 'Comisión' : `Comisión (${Math.round(trip.commissionRate * 100)} %)`;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: trip.origin.lat,
          longitude: trip.origin.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onMapReady={handleMapReady}
        accessibilityLabel="Mapa con la ruta del viaje"
      >
        <Marker
          coordinate={{ latitude: trip.origin.lat, longitude: trip.origin.lng }}
          title="Recogida"
          pinColor="#15803D"
        />
        <Marker
          coordinate={{ latitude: trip.destination.lat, longitude: trip.destination.lng }}
          title="Destino"
          pinColor="#DC2626"
        />
        {routePoints.length > 1 ? <Polyline coordinates={routePoints} strokeWidth={5} strokeColor="#2563EB" /> : null}
      </MapView>
      {routePoints.length < 2 ? <Text style={styles.note}>Este viaje no tiene la ruta guardada.</Text> : null}

      <View style={styles.card}>
        <Text style={styles.date}>{formatDateTime(new Date(trip.completedAtMs))}</Text>
        <Text style={[styles.sectionTitle, styles.spaced]}>Recogida</Text>
        <Text style={styles.address}>{trip.origin.address}</Text>
        <Text style={[styles.sectionTitle, styles.spaced]}>Destino</Text>
        <Text style={styles.address}>{trip.destination.address}</Text>
      </View>

      <View style={styles.card}>
        <DetailRow label="Distancia" value={`${trip.distanceKm} km`} />
        <DetailRow label="Duración" value={`${trip.durationMin} min`} />
        <DetailRow label="Categoría" value={labelFor(CATEGORY_OPTIONS, trip.category)} />
        <DetailRow label="Método de pago" value={paymentMethodLabel(trip.paymentMethod)} />
        <DetailRow label="Estado del pago" value={historyStatusLabel(trip)} />
        <DetailRow label="Calificación" value="Sin calificación" />
      </View>

      <View style={styles.card}>
        <DetailRow label="Tarifa" value={formatCop(trip.fare)} />
        <DetailRow label={commissionLabel} value={`- ${formatCop(trip.commission)}`} />
        <DetailRow label="Propina" value={formatCop(trip.tip)} />
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.earningsLabel}>Tu ganancia</Text>
          <Text style={styles.earningsValue}>{formatCop(trip.driverEarnings)}</Text>
        </View>
      </View>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  map: {
    height: 260,
    borderRadius: 12,
    marginBottom: 12,
  },
  note: {
    marginTop: -4,
    marginBottom: 12,
    fontSize: 13,
    textAlign: 'center',
    color: '#6B7280',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  date: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
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
    fontSize: 14,
    textAlign: 'center',
    color: '#DC2626',
  },
});
