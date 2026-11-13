// src/screens/main/EarningsScreen.js
// Ganancias (enunciado §3 S5 y §5 T8/T9): número de viajes, total facturado,
// comisiones, propinas, ganancia neta y promedio por viaje de hoy, la semana o
// el mes, y el saldo con la plataforma. Solo cuentan los viajes PAGADOS
// (dinero real); los que quedaron sin pagar se muestran aparte.
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import useEarnings from '../../hooks/useEarnings';
import { PERIOD } from '../../config/history';
import { formatCop } from '../../utils/tripRequestData';

const PERIOD_OPTIONS = [
  { value: PERIOD.TODAY, label: 'Hoy' },
  { value: PERIOD.WEEK, label: 'Semana' },
  { value: PERIOD.MONTH, label: 'Mes' },
];

function DetailRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function EarningsScreen() {
  const [period, setPeriod] = useState(PERIOD.TODAY);
  const { summary, balance, isLoading, hasError } = useEarnings(period);

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
        <Text style={styles.error}>No se pudieron cargar tus ganancias. Revisa tu conexión.</Text>
      </View>
    );
  }

  const isNegative = balance < 0;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.periods} accessibilityRole="tablist">
        {PERIOD_OPTIONS.map((option) => {
          const isSelected = option.value === period;
          return (
            <Pressable
              key={option.value}
              style={[styles.period, isSelected && styles.periodSelected]}
              onPress={() => setPeriod(option.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={[styles.periodText, isSelected && styles.periodTextSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Ganancia neta</Text>
        <Text style={styles.bigValue}>{formatCop(summary.netEarnings)}</Text>
        <View style={styles.divider} />
        <DetailRow label="Viajes pagados" value={String(summary.tripCount)} />
        <DetailRow label="Total facturado" value={formatCop(summary.totalFare)} />
        <DetailRow label="Comisiones" value={`- ${formatCop(summary.totalCommission)}`} />
        <DetailRow label="Propinas" value={formatCop(summary.totalTips)} />
        <DetailRow label="Promedio por viaje" value={formatCop(summary.averagePerTrip)} />
        {summary.tripCount === 0 ? <Text style={styles.empty}>No hay viajes pagados en este periodo.</Text> : null}
      </View>

      {summary.pending.tripCount > 0 ? (
        <View style={[styles.card, styles.pendingCard]}>
          <Text style={styles.pendingText}>
            Pendiente de pago: {summary.pending.tripCount} {summary.pending.tripCount === 1 ? 'viaje' : 'viajes'} ·{' '}
            {formatCop(summary.pending.amount)}
          </Text>
          <Text style={styles.note}>No se suma a tus ganancias hasta que se pague.</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Saldo con la plataforma</Text>
        <Text style={[styles.bigValue, isNegative && styles.negative]}>{formatCop(balance)}</Text>
        <Text style={styles.note}>
          {isNegative
            ? 'Debes las comisiones de los viajes cobrados en efectivo.'
            : 'La plataforma te debe las ganancias de los viajes pagados con Mercado Pago.'}
        </Text>
        <Text style={styles.note}>
          Mercado Pago suma tu ganancia; en efectivo ya recibiste el dinero y se descuenta la comisión. Incluye todos tus
          viajes pagados.
        </Text>
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
  periods: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  period: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#111827',
    backgroundColor: '#FFFFFF',
  },
  periodSelected: {
    backgroundColor: '#111827',
  },
  periodText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  periodTextSelected: {
    color: '#FFFFFF',
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
  bigValue: {
    marginTop: 4,
    fontSize: 28,
    fontWeight: '700',
    color: '#15803D',
  },
  negative: {
    color: '#DC2626',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
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
  empty: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    color: '#6B7280',
  },
  pendingCard: {
    backgroundColor: '#FEF3C7',
  },
  pendingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
  },
  note: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B7280',
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
    color: '#DC2626',
  },
});
