// src/screens/main/HistoryScreen.js
// Historial (enunciado §3 S6 y §6): viajes terminados del más reciente al más
// antiguo, con filtros por periodo (Hoy, Semana, Mes, Rango de fechas) y por
// método de pago. FlatList muestra 20 y carga 20 más al llegar al final (HI7).
// Los filtros se aplican en la app con useMemo (sin nuevas consultas).
// Al tocar un viaje se abre su detalle (HI4).
// Textos en el idioma elegido (useLanguage).
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import useFinishedTrips from '../../hooks/useFinishedTrips';
import useLanguage from '../../hooks/useLanguage';
import DateField from '../../components/DateField';
import { HISTORY, PERIOD } from '../../config/history';
import { getPeriodRange, getCustomRange, filterTrips } from '../../utils/earnings';
import { formatCop } from '../../utils/tripRequestData';
import { formatDateTime } from '../../utils/dates';
import { optionLabel, paymentMethodText, historyStatusText } from '../../i18n/labels';
import { TRIP_STATUS } from '../../config/tripRequest';

const RANGE = 'range'; // "Rango de fechas": se eligen Desde y Hasta

// labelKey: clave del texto en src/i18n.
const PERIOD_OPTIONS = [
  { value: PERIOD.TODAY, labelKey: 'periods.today' },
  { value: PERIOD.WEEK, labelKey: 'periods.week' },
  { value: PERIOD.MONTH, labelKey: 'periods.month' },
  { value: RANGE, labelKey: 'periods.range' },
];

const PAYMENT_OPTIONS = [
  { value: 'all', labelKey: 'history.allPayments' },
  { value: 'mercadopago', labelKey: 'paymentMethod.mercadopago' },
  { value: 'cash', labelKey: 'paymentMethod.cash' },
];

// Fila de botones para elegir una opción (periodo o método de pago).
function OptionRow({ options, selected, onSelect, t }) {
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
            <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{t(option.labelKey)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Un viaje de la lista (HI3): fecha y hora, origen → destino, categoría,
// tarifa, ganancia y estado del pago. Al tocarlo se abre el detalle.
function TripItem({ trip, onPress, t }) {
  const isUnpaid = trip.status === TRIP_STATUS.COMPLETED;
  return (
    <Pressable
      style={styles.item}
      onPress={() => onPress(trip.id)}
      accessibilityRole="button"
      accessibilityHint={t('history.openDetailHint')}
    >
      <View style={styles.itemHeader}>
        <Text style={styles.itemDate}>{formatDateTime(new Date(trip.completedAtMs))}</Text>
        <Text style={[styles.badge, isUnpaid ? styles.badgeUnpaid : styles.badgePaid]}>{historyStatusText(t, trip)}</Text>
      </View>
      <Text style={styles.itemRoute} numberOfLines={2}>
        {trip.origin.address} → {trip.destination.address}
      </Text>
      <Text style={styles.itemDetail}>
        {optionLabel(t, 'category', trip.category)} · {paymentMethodText(t, trip.paymentMethod)}
      </Text>
      <View style={styles.itemAmounts}>
        <Text style={styles.itemFare}>{t('history.fare', { amount: formatCop(trip.fare) })}</Text>
        <Text style={styles.itemEarnings}>{t('history.earnings', { amount: formatCop(trip.driverEarnings) })}</Text>
      </View>
    </Pressable>
  );
}

export default function HistoryScreen({ navigation }) {
  const { trips, isLoading, hasError } = useFinishedTrips();
  const { t } = useLanguage();
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

  const openDetail = useCallback((tripId) => navigation.navigate('TripDetail', { tripId }), [navigation]);
  // t es dependencia: al cambiar el idioma, los ítems se vuelven a dibujar.
  const renderItem = useCallback(({ item }) => <TripItem trip={item} onPress={openDetail} t={t} />, [openDetail, t]);

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
        <Text style={styles.error}>{t('history.loadError')}</Text>
      </View>
    );
  }

  const filters = (
    <View>
      <OptionRow options={PERIOD_OPTIONS} selected={period} onSelect={setPeriod} t={t} />
      {period === RANGE ? (
        <View style={styles.rangeFields}>
          <View style={styles.rangeField}>
            <DateField label={t('history.from')} value={fromDate} onChange={setFromDate} maximumDate={new Date()} />
          </View>
          <View style={styles.rangeField}>
            <DateField
              label={t('history.to')}
              value={toDate}
              onChange={setToDate}
              maximumDate={new Date()}
              error={isInvalidRange ? t('history.invalidRange') : undefined}
            />
          </View>
        </View>
      ) : null}
      <OptionRow options={PAYMENT_OPTIONS} selected={paymentMethod} onSelect={setPaymentMethod} t={t} />
      <Text style={styles.count}>
        {t(filteredTrips.length === 1 ? 'history.countOne' : 'history.countMany', { count: filteredTrips.length })}
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
        isInvalidRange ? null : <Text style={styles.empty}>{t('history.empty')}</Text>
      }
      ListFooterComponent={
        visibleTrips.length < filteredTrips.length ? (
          <Text style={styles.footer}>
            {t('history.showing', { visible: visibleTrips.length, total: filteredTrips.length })}
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
    marginBottom: 12, // espacio entre "Hasta" (y su error) y los botones de método de pago
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
