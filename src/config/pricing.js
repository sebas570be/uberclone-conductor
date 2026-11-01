// src/config/pricing.js
// Single source of truth for fares and platform commission.
// Every amount is an integer in Colombian pesos (COP): integers avoid
// floating-point errors such as 0.1 + 0.2 = 0.30000000000000004.
// Changing a value here changes the estimate AND the final charge, because
// both use calculateFare (src/utils/calculateFare.js).
// AI-assisted: see docs/AI_LOG.md #3

export const PRICING = Object.freeze({
  baseFare: 3500, // COP charged at the start of every trip
  pricePerKm: 1200, // COP per kilometer (distance comes from the routes API)
  pricePerMinute: 250, // COP per minute of trip duration
  minimumFare: 6000, // a trip never costs less than this
  roundingStep: 100, // fare is rounded to the nearest multiple of 100 COP
  commissionRate: 0.2, // 20 % for the platform; tips go 100 % to the driver
  categoryMultipliers: Object.freeze({
    economy: 1.0,
    xl: 1.4,
    premium: 1.8,
  }),
});
