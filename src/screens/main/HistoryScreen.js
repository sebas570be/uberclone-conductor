// src/screens/main/HistoryScreen.js
// Historial (enunciado §3 S6 y §6): viajes terminados del más reciente al más
// antiguo, con filtros por periodo (Hoy, Semana, Mes, Rango de fechas) y por
// método de pago. FlatList muestra 20 y carga 20 más al llegar al final (HI7).
// Los filtros se aplican en la app con useMemo (sin nuevas consultas).
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import useFinishedTrips from '../../hooks/useFinishedTrips';
import DateField from '../../components/DateField';
import { HISTORY, PERIOD } from '../../config/history';
import { getPeriodRange, getCustomRange, filterTrips, historyStatusLabel } from '../../utils/earnings';
import { formatCop, paymentMethodLabel } from '../../utils/tripRequestData';
import { formatDateTime } from '../../utils/dates';
import { CATEGORY_OPTIONS, labelFor } from '../../constants/registrationOptions';
import { TRIP_STATUS } from '../../config/tripRequest';

const RANGE = 'range'; // "Rango de fechas": se eligen Desde y Hasta

const PERIOD_OPTIONS = [
  { value: PERIOD.TODAY, label: 'Hoy' },
  { value: PERIOD.WEEK, label: 'Semana' },
  { value: PERIOD.MONTH, label: 'Mes' },
  { value: RANGE, label: 'Rango' },
];

const PAYMENT_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'mercadopago', label: 'Mercado Pago' },
  { value: 'cash', label: 'Efectivo' },
];

// Fila de botones para elegir una opción (periodo o método de pago).
function OptionRow({ options, selected, onSelect }) {
  return (
    <View style={styles.options} accessibilityRole="tablist">
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <Pressable
            key={option.value}
            style={[styles.option, isSelected && styles.optionSelected]}
            onPress={() => onSelect(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
          >
            <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Un viaje de la lista (HI3): fecha y hora, origen → destino, categoría,
// tarifa, ganancia y estado del pago.
function TripItem({ trip }) {
  const isUnpaid = trip.status === TRIP_STATUS.COMPLETED;
  return (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemDate}>{formatDateTime(new Date(trip.completedAtMs))}</Text>
        <Text style={[styles.badge, isUnpaid ? styles.badgeUnpaid : styles.badgePaid]}>{historyStatusLabel(trip)}</Text>
      </View>
      <Text style={styles.itemRoute} numberOfLines={2}>
        {trip.origin.address} → {trip.destination.address}
      </Text>
      <Text style={styles.itemDetail}>
        {labelFor(CATEGORY_OPTIONS, trip.category)} · {paymentMethodLabel(trip.paymentMethod)}
      </Text>
      <View style={styles.itemAmounts}>
        <Text style={styles.itemFare}>Tarifa {formatCop(trip.fare)}</Text>
        <Text style={styles.itemEarnings}>Ganancia {formatCop(trip.driverEarnings)}</Text>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const { trips, isLoading, hasError } = useFinishedTrips();
  const [period, setPeriod] = useState(PERIOD.MONTH);
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [fromDate, setFromDate] = useState(() => new Date());
  const [toDate, setToDate] = useState(() => new Date());
  const [visibleCount, setVisibleCount] = useState(HISTORY.pageSize);

  // Igual que en Ganancias: al volver a la pantalla otro día, "Hoy" se
  // recalcula con el día nuevo (today es dependencia del useMemo).
  useIsFocused();
  const today = new Date().toDateString();

  const range = useMemo(
    () => (period === RANGE ? getCustomRange(fromDate, toDate) : getPeriodRange(period)),
    [period, fromDate, toDate, today]
  );
  const isInvalidRange = period === RANGE && range === null;

  // useMemo: filtrar y ordenar solo cuando cambian los viajes o los filtros.
  const filteredTrips = useMemo(
    () => (isInvalidRange ? [] : filterTrips(trips, { range, paymentMethod })),
    [trips, range, paymentMethod, isInvalidRange]
  );

  // Al cambiar un filtro se vuelve a empezar por los 20 primeros.
  useEffect(() => {
    setVisibleCount(HISTORY.pageSize);
  }, [range, paymentMethod]);

  const visibleTrips = useMemo(() => filteredTrips.slice(0, visibleCount), [filteredTrips, visibleCount]);

  // Al llegar al final se muestran 20 más. Si se dispara varias veces, no
  // pasa nada: nunca se pasa del total.
  const handleEndReached = useCallback(() => {
    setVisibleCount((count) => Math.min(count + HISTORY.pageSize, filteredTrips.length));
  }, [filteredTrips.length]);

  const renderItem = useCallback(({ item }) => <TripItem trip={item} />, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>No se pudo cargar tu historial. Revisa tu conexión.</Text>
      </View>
    );
  }

  const filters = (
    <View>
      <OptionRow options={PERIOD_OPTIONS} selected={period} onSelect={setPeriod} />
      {period === RANGE ? (
        <View style={styles.rangeFields}>
          <View style={styles.rangeField}>
            <DateField label="Desde" value={fromDate} onChange={setFromDate} maximumDate={new Date()} />
          </View>
          <View style={styles.rangeField}>
            <DateField
              label="Hasta"
              value={toDate}
              onChange={setToDate}
              maximumDate={new Date()}
              error={isInvalidRange ? '"Desde" no puede ser después de "Hasta".' : undefined}
            />
          </View>
        </View>
      ) : null}
      <OptionRow options={PAYMENT_OPTIONS} selected={paymentMethod} onSelect={setPaymentMethod} />
      <Text style={styles.count}>
        {filteredTrips.length} {filteredTrips.length === 1 ? 'viaje' : 'viajes'}
      </Text>
    </View>
  );

  return (
    <FlatList
      data={visibleTrips}
      keyExtractor={(trip) => trip.id}
      renderItem={renderItem}
      ListHeaderComponent={filters}
      ListEmptyComponent={
        isInvalidRange ? null : <Text style={styles.empty}>No hay viajes en este filtro.</Text>
      }
      ListFooterComponent={
        visibleTrips.length < filteredTrips.length ? (
          <Text style={styles.footer}>
            Mostrando {visibleTrips.length} de {filteredTrips.length}
          </Text>
        ) : null
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      initialNumToRender={10}
      contentContainerStyle={styles.content}
    />
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
  options: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#111827',
    backgroundColor: '#FFFFFF',
  },
  optionSelected: {
    backgroundColor: '#111827',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  rangeFields: {
    flexDirection: 'column',
  },
  rangeField: {
    flex: 1,
  },
  count: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  item: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  badge: {
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '700',
  },
  badgePaid: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
  },
  badgeUnpaid: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  itemRoute: {
    marginTop: 6,
    fontSize: 15,
    color: '#111827',
  },
  itemDetail: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
  itemAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  itemFare: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  itemEarnings: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
  },
  empty: {
    marginTop: 24,
    fontSize: 15,
    textAlign: 'center',
    color: '#6B7280',
  },
  footer: {
    marginTop: 4,
    fontSize: 13,
    textAlign: 'center',
    color: '#6B7280',
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
    color: '#DC2626',
  },
});
