// src/config/pricing.js
// Única fuente de verdad de las tarifas y la comisión de la plataforma.
// Todos los valores son pesos colombianos (COP) enteros: con enteros se evitan
// errores de decimales como 0.1 + 0.2 = 0.30000000000000004.
// Cambiar un valor aquí cambia la estimación Y el cobro final, porque ambos
// usan calculateFare (src/utils/calculateFare.js).
// AI-assisted: see docs/AI_LOG.md #1

export const PRICING = Object.freeze({
  baseFare: 3500, // COP que se cobran al iniciar cualquier viaje
  pricePerKm: 1200, // COP por kilómetro (la distancia viene de la API de rutas)
  pricePerMinute: 250, // COP por minuto de duración del viaje
  minimumFare: 6000, // ningún viaje cuesta menos que esto
  roundingStep: 100, // la tarifa se redondea al múltiplo de 100 COP más cercano
  commissionRate: 0.2, // 20 % para la plataforma; la propina va 100 % al conductor
  // Multiplicador según la categoría del vehículo elegida por el pasajero
  categoryMultipliers: Object.freeze({
    economy: 1.0,
    xl: 1.4,
    premium: 1.8,
  }),
});
