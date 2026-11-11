// src/utils/tripCompletion.js
// Datos que se guardan al tocar "Finalizar" (enunciado G2 y T7): la tarifa
// final se calcula con la MISMA función de la estimación (calculateFare) y el
// viaje guarda commissionRate. Las reglas de Firestore recalculan la tarifa
// con la misma fórmula y rechazan cualquier otro valor.
// Función pura (sin Firebase): se prueba con Jest. completedAt (hora del
// servidor) lo agrega el servicio.
import { calculateFare } from './calculateFare';
import { TRIP_STATUS } from '../config/tripRequest';

export function buildCompletionData(trip) {
  // Sin propina por ahora: la propina llega con la rama de pagos.
  const { fare, commission, tip, driverEarnings, commissionRate } = calculateFare({
    distanceKm: trip.distanceKm,
    durationMin: trip.durationMin,
    category: trip.category,
  });
  return {
    status: TRIP_STATUS.COMPLETED,
    fare,
    commission,
    tip,
    driverEarnings,
    commissionRate,
  };
}
