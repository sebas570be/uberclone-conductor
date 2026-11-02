// src/utils/calculateFare.js
// Calcula tarifa, comisión y ganancia del conductor para un viaje.
// Es una función pura: con los mismos datos siempre da el mismo resultado
// y no toca red, estado ni base de datos. Por eso se puede probar con Jest.
// Se usa en la estimación de la solicitud Y en el cobro final del viaje.
// AI-assisted: see docs/AI_LOG.md #3
import { PRICING } from '../config/pricing';

export function calculateFare({ distanceKm, durationMin, category, tip = 0 }) {
  // 1. Validar datos de entrada: un dato inválido es un error del sistema,
  //    así que se lanza un error en vez de devolver 0 o null.
  const multiplier = PRICING.categoryMultipliers[category];
  if (multiplier === undefined) {
    throw new Error(`Categoría desconocida: ${category}`);
  }
  // !(x >= 0) también atrapa undefined, null, NaN y textos
  if (!(distanceKm >= 0) || !(durationMin >= 0) || !(tip >= 0)) {
    throw new Error('Distancia, duración y propina deben ser números mayores o iguales a 0');
  }

  // 2. Tarifa = max(Mínima, (Base + km·Vkm + min·Vmin) · Multiplicador)
  const rawFare =
    (PRICING.baseFare + distanceKm * PRICING.pricePerKm + durationMin * PRICING.pricePerMinute) *
    multiplier;
  const fareWithMinimum = Math.max(PRICING.minimumFare, rawFare);

  // 3. Redondear al múltiplo de 100 más cercano ANTES de calcular la comisión
  const fare = Math.round(fareWithMinimum / PRICING.roundingStep) * PRICING.roundingStep;

  // 4. Comisión sobre la tarifa (no sobre la propina); Math.round protege de decimales
  const commission = Math.round(fare * PRICING.commissionRate);

  // 5. Ganancia neta = Tarifa − Comisión + Propina
  const driverEarnings = fare - commission + tip;

  // commissionRate se devuelve para guardarlo en el viaje (el historial no cambia
  // aunque la comisión cambie después)
  return { fare, commission, tip, driverEarnings, commissionRate: PRICING.commissionRate };
}
