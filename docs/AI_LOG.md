# Bitácora de uso de IA — UberClone Versión Conductor

Proyecto individual. Se registra el uso de herramientas de IA en el momento de usarlas.
Los bloques de código asistidos se marcan con `// AI-assisted: see docs/AI_LOG.md #N`.
Regla: nunca se pegan en un prompt llaves de API, access_token ni datos personales reales.

---



### Entrada #1
- Fecha: 2026-11-04
- Integrante: Fray Sebastián Benítez Rodríguez
- Herramienta: Gemini
- Objetivo: Realizar un code review de la función `calculateFare` y sus validaciones para un proyecto de UberClone versión conductor en React Native.
- Prompt: "Estoy haciendo solo un proyecto para la materia Desarrollo Móvil: UberClone versión conductor. Stack: Expo SDK 58, React Native 0.88, JavaScript (sin TypeScript), pruebo con Expo Go en iPhone. No me sugieras instalar librerías nuevas.

  Tengo una función pura calculateFare en src/utils/calculateFare.js que calcula la tarifa, la comisión del 20 % y la ganancia del conductor. Los valores vienen de src/config/pricing.js. Con el ejemplo del enunciado (8,5 km y 22 min) da bien: Económico 19.200 / 3.840 / 15.360 y XL 26.900 / 5.380 / 21.520.

  Revisándola encontré un error en la validación. Antes estaba así:

  if (!(distanceKm >= 0) || !(durationMin >= 0) || !(tip >= 0)) { throw ... }

  Si llega distanceKm = '5' (texto), pasa la validación porque '5' >= 0 da true. Y si la propina llega como '1000', la ganancia queda "153601000" porque el + pega el texto en vez de sumar. Tampoco atrapa Infinity.

  Esta es la propuesta de cambio:

  ```js
  const isValidAmount = (value) =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0;

  export function calculateFare({ distanceKm, durationMin, category, tip = 0 }) {
    const multiplier = PRICING.categoryMultipliers[category];
    if (multiplier === undefined) {
      throw new Error(`Categoría desconocida: ${category}`);
    }
    if (!isValidAmount(distanceKm) || !isValidAmount(durationMin) || !isValidAmount(tip)) {
      throw new Error('Distancia, duración y propina deben ser números mayores o iguales a 0');
    }
    const rawFare =
      (PRICING.baseFare + distanceKm * PRICING.pricePerKm + durationMin * PRICING.pricePerMinute) *
      multiplier;
    const fareWithMinimum = Math.max(PRICING.minimumFare, rawFare);
    const fare = Math.round(fareWithMinimum / PRICING.roundingStep) * PRICING.roundingStep;
    const commission = Math.round(fare * PRICING.commissionRate);
    const driverEarnings = fare - commission + tip;
    return { fare, commission, tip, driverEarnings, commissionRate: PRICING.commissionRate };
  }
  ```

  Hazme un par review. Mis dudas:
  1. ¿Es mejor lanzar un error cuando el dato es inválido, o convertirlo con Number('5') para que siga funcionando? Pienso que convertir escondería un error de la API de rutas, pero no estoy seguro.
  2. ¿Dejo isValidAmount dentro de este archivo o la paso a utils/validators.js? Por ahora solo la usa calculateFare.
  3. ¿Se me escapa algún caso que todavía pase la validación?"
- Resumen de la respuesta: Se validó favorablemente el uso de errores explícitos (fail fast) en lugar de conversiones automáticas, se recomendó mantener la función auxiliar local aplicando el principio YAGNI, y se discutió el manejo de valores numéricos en cero versus la lógica de negocio en la capa de servicios.
- Qué se usó / modificó / descartó: Se adoptó la estrategia de lanzar excepciones ante datos no numéricos y mantener `isValidAmount` de forma local en el archivo de utilidades, descartando por decisión de diseño del usuario agregar validaciones estrictas mayores a cero en esta capa pura para permitir tarifas mínimas y redondeos de duración.
- Archivos y commit: src/utils/calculateFare.js, src/config/pricing.js — ab1b000
- Verificación: Comprobación conceptual de tipos de datos, manejo de límites numéricos finitos y separación de responsabilidades entre la utilidad de cálculo y la capa de servicios. - Verificación: Pruebas unitarias con Jest (jest-expo) en src/utils/__tests__/calculateFare.test.js — commit 9140383. `npm test`: 4 passed de 4. Comprueban el ejemplo del enunciado (8,5 km y 22 min: Económico 19.200 / 3.840 / 15.360 y XL 26.900 / 5.380 / 21.520) y que la función rechaza una distancia en texto ('5') y una propina en texto ('1000').
- Aprendizaje: Mantener las funciones de cálculo puras y estrictas en cuanto a tipos de datos previene errores silenciosos de concatenación, delegando las reglas de negocio de flujos operativos hacia las capas superiores correspondientes.