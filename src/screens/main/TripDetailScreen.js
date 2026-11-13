// src/screens/main/TripDetailScreen.js
// Detalle de un viaje del historial (enunciado §6 HI4): ruta dibujada con
// Polyline (no Static Maps, A8), duración, distancia, comisión, propina y
// calificación. El viaje sale de la misma escucha del historial
// (useFinishedTrips), así que si cambia (por ejemplo, se paga) se ve aquí.
// Textos en el idioma elegido (useLanguage).
import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import useFinishedTrips from '../../hooks/useFinishedTrips';
import useLanguage from '../../hooks/useLanguage';
import { decodePolyline } from '../../utils/polyline';
import { formatCop } from '../../utils/tripRequestData';
import { formatDateTime } from '../../utils/dates';
import { optionLabel, paymentMethodText, historyStatusText } from '../../i18n/labels';

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
  const { t } = useLanguage();
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
        <Text style={styles.error}>{t('tripDetail.notFound')}</Text>
      </View>
    );
  }

  const commissionLabel =
    trip.commissionRate === null
      ? t('tripDetail.commission')
      : t('tripDetail.commissionRate', { rate: Math.round(trip.commissionRate * 100) });

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
        accessibilityLabel={t('tripDetail.map')}
      >
        <Marker
          coordinate={{ latitude: trip.origin.lat, longitude: trip.origin.lng }}
          title={t('tripDetail.pickup')}
          pinColor="#15803D"
        />
        <Marker
          coordinate={{ latitude: trip.destination.lat, longitude: trip.destination.lng }}
          title={t('tripDetail.destination')}
          pinColor="#DC2626"
        />
        {routePoints.length > 1 ? <Polyline coordinates={routePoints} strokeWidth={5} strokeColor="#2563EB" /> : null}
      </MapView>
      {routePoints.length < 2 ? <Text style={styles.note}>{t('tripDetail.noRoute')}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.date}>{formatDateTime(new Date(trip.completedAtMs))}</Text>
        <Text style={[styles.sectionTitle, styles.spaced]}>{t('tripDetail.pickup')}</Text>
        <Text style={styles.address}>{trip.origin.address}</Text>
        <Text style={[styles.sectionTitle, styles.spaced]}>{t('tripDetail.destination')}</Text>
        <Text style={styles.address}>{trip.destination.address}</Text>
      </View>

      <View style={styles.card}>
        <DetailRow label={t('tripDetail.distance')} value={`${trip.distanceKm} km`} />
        <DetailRow label={t('tripDetail.duration')} value={`${trip.durationMin} min`} />
        <DetailRow label={t('fields.category')} value={optionLabel(t, 'category', trip.category)} />
        <DetailRow label={t('tripDetail.paymentMethod')} value={paymentMethodText(t, trip.paymentMethod)} />
        <DetailRow label={t('tripDetail.paymentStatus')} value={historyStatusText(t, trip)} />
        <DetailRow label={t('tripDetail.rating')} value={t('tripDetail.noRating')} />
      </View>

      <View style={styles.card}>
        <DetailRow label={t('tripDetail.fare')} value={formatCop(trip.fare)} />
        <DetailRow label={commissionLabel} value={`- ${formatCop(trip.commission)}`} />
        <DetailRow label={t('tripDetail.tip')} value={formatCop(trip.tip)} />
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.earningsLabel}>{t('tripDetail.yourEarnings')}</Text>
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
