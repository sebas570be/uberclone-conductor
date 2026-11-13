// src/hooks/useEarnings.js
// Hook personalizado obligatorio del enunciado (H6): ganancias del periodo
// elegido (hoy, semana o mes) y saldo con la plataforma.
// useMemo (H4): los totales solo se recalculan si cambian los viajes, el
// periodo o el día, no en cada render.
import { useMemo } from 'react';
import { useIsFocused } from '@react-navigation/native';
import useFinishedTrips from './useFinishedTrips';
import { getPeriodRange, filterTrips, summarizeEarnings, calculateBalance } from '../utils/earnings';

export default function useEarnings(period) {
  const { trips, isLoading, hasError } = useFinishedTrips();

  // El día de hoy como dependencia: si la pantalla quedó abierta y pasa la
  // medianoche, al volver a ella (useIsFocused la vuelve a dibujar) "Hoy" se
  // recalcula con el día nuevo en vez de seguir mostrando el de ayer.
  useIsFocused();
  const today = new Date().toDateString();

  const summary = useMemo(
    () => summarizeEarnings(filterTrips(trips, { range: getPeriodRange(period) })),
    // today no se usa adentro, pero obliga a recalcular cuando cambia el día.
    [trips, period, today]
  );

  // El saldo es de TODOS los viajes pagados, no solo del periodo: es lo que
  // la plataforma y el conductor se deben hasta hoy (T9).
  const balance = useMemo(() => calculateBalance(trips), [trips]);

  return { summary, balance, isLoading, hasError };
}
