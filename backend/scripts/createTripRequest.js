// backend/scripts/createTripRequest.js
// Simulador de la "app del pasajero" (no existe en este proyecto): crea UNA
// solicitud de viaje (trips/{id}, status "requested") para un conductor
// aprobado que esté Disponible y enviando ubicación.
// Uso (desde la carpeta backend):
//   npm run solicitud                  → método de pago al azar
//   npm run solicitud -- cash          → fuerza efectivo
//   npm run solicitud -- mercadopago   → fuerza Mercado Pago
// AI-assisted: see docs/AI_LOG.md #10
const { FieldValue } = require('firebase-admin/firestore');
const { db, messaging } = require('../src/firebaseAdmin');
const { CONFIG } = require('../src/config');
const { getDrivingRoute } = require('../src/services/routeService');
const { reverseGeocode } = require('../src/services/geocodingService');
const {
  randomPointNear,
  isValidPoint,
  isFreshLocation,
  pickPaymentMethod,
  toTripMetrics,
  buildTripRequest,
} = require('../src/utils/tripRequest');
const { buildTripRequestMessage, isTokenGone } = require('../src/utils/pushMessage');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Primer conductor que cumpla TODO: Disponible, ubicación de hace menos de 5 min,
// registro "approved", categoría válida y sin otro viaje activo.
// firebase-admin se salta las reglas, por eso aquí se revisa lo mismo que ellas exigen.
// Devuelve también POR QUÉ se descartó a cada uno, para saber qué arreglar.
async function findAvailableDriver(now) {
  const locations = await db.collection('driverLocations').where('isAvailable', '==', true).get();
  const skipped = [];
  // Solo los 6 primeros caracteres del uid: suficiente para reconocerlo.
  const skip = (driverId, reason) => skipped.push(`${driverId.slice(0, 6)}: ${reason}`);

  for (const locationDoc of locations.docs) {
    const driverId = locationDoc.id;
    const { location, updatedAt } = locationDoc.data();
    // driverLocations guarda latitude/longitude; trips usa lat/lng (nombres del enunciado).
    const position = { lat: location?.latitude, lng: location?.longitude };
    const updatedAtDate = updatedAt?.toDate?.();
    if (!isFreshLocation(updatedAtDate, now, CONFIG.staleAfterMs)) {
      const age = updatedAtDate ? `hace ${Math.round((now - updatedAtDate) / 1000)} s` : 'sin fecha';
      skip(driverId, `ubicación vieja (${age}); abre la app y vuelve a ponerte Disponible`);
      continue;
    }
    if (!isValidPoint(position)) {
      skip(driverId, 'ubicación inválida o vacía');
      continue;
    }

    const driver = (await db.collection('drivers').doc(driverId).get()).data();
    const category = driver?.vehicle?.category;
    if (!driver) {
      skip(driverId, 'no tiene registro en drivers');
      continue;
    }
    if (driver.status !== 'approved') {
      skip(driverId, `registro no aprobado (status: ${driver.status})`);
      continue;
    }
    if (!CONFIG.categories.includes(category)) {
      skip(driverId, 'sin categoría de vehículo válida (¿cuenta creada antes del formulario de registro?)');
      continue;
    }

    const activeTrips = await db
      .collection('trips')
      .where('driverId', '==', driverId)
      .where('status', 'in', CONFIG.activeStatuses)
      .limit(1)
      .get();
    if (!activeTrips.empty) {
      skip(driverId, `ya tiene un viaje activo (trips/${activeTrips.docs[0].id}, status: ${activeTrips.docs[0].data().status})`);
      continue;
    }

    return { driver: { driverId, category, position, language: driver.language }, skipped };
  }
  return { driver: null, skipped };
}

// Notificación push al conductor (enunciado §7): avisa aunque la app esté en
// segundo plano. El token lo guarda la app en pushTokens/{uid} (solo la APK de
// Android). Si falla, la solicitud igual quedó creada: la app la ve al abrirse.
async function notifyDriver(driver, tripId, metrics) {
  const tokenDoc = await db.collection('pushTokens').doc(driver.driverId).get();
  const token = tokenDoc.data()?.token;
  if (!token) {
    console.log('Sin notificación: el conductor no tiene token (Expo Go, iPhone o permiso negado).');
    return;
  }
  const message = buildTripRequestMessage({
    token,
    tripId,
    language: driver.language,
    distanceKm: metrics.distanceKm,
    durationMin: metrics.durationMin,
    ttlMs: CONFIG.pushTtlMs,
    channelId: CONFIG.pushChannelId,
  });
  try {
    await messaging.send(message);
    console.log('Notificación push enviada.');
  } catch (error) {
    if (isTokenGone(error)) {
      await tokenDoc.ref.delete();
      console.log('El token ya no sirve (¿app desinstalada?): se borró.');
    } else {
      console.log(`No se pudo enviar la notificación: ${error.code ?? error.message}`);
    }
  }
}

async function main() {
  // Se valida el argumento ANTES de consultar nada.
  const paymentMethod = pickPaymentMethod(process.argv[2], CONFIG.paymentMethods);

  const { driver, skipped } = await findAvailableDriver(new Date());
  if (!driver) {
    console.log('No hay conductores disponibles: abre la app con una cuenta aprobada y activa "Disponible".');
    if (skipped.length === 0) {
      console.log('Ningún conductor tiene el switch en "Disponible".');
    } else {
      console.log('Conductores descartados:');
      skipped.forEach((reason) => console.log(`  - ${reason}`));
    }
    process.exitCode = 1;
    return;
  }

  // Origen cerca del conductor; destino a unos km del origen.
  const { pickupDistanceMeters: pickup, tripDistanceMeters: trip } = CONFIG;
  const roughOrigin = randomPointNear(driver.position, pickup.min, pickup.max);
  const roughDestination = randomPointNear(roughOrigin, trip.min, trip.max);

  // Una sola llamada a la API de rutas por solicitud (enunciado §7).
  const route = await getDrivingRoute(roughOrigin, roughDestination);
  const metrics = toTripMetrics(route.distanceMeters, route.durationSeconds);

  const originAddress = await reverseGeocode(route.start);
  await sleep(CONFIG.nominatimDelayMs); // respetar 1 consulta por segundo
  const destinationAddress = await reverseGeocode(route.end);

  const tripRequest = buildTripRequest({
    driverId: driver.driverId,
    passengerId: CONFIG.simulatedPassengerId,
    category: driver.category,
    origin: { ...route.start, address: originAddress },
    destination: { ...route.end, address: destinationAddress },
    metrics,
    routePolyline: route.polyline,
    paymentMethod,
  });

  const tripRef = await db.collection('trips').add({
    ...tripRequest,
    createdAt: FieldValue.serverTimestamp(), // hora del servidor (como en la app)
  });

  // No se imprimen direcciones ni coordenadas: la salida se puede copiar o
  // mostrar sin exponer ubicaciones reales.
  console.log(`Solicitud creada: trips/${tripRef.id}`);
  console.log(`${metrics.distanceKm} km · ${metrics.durationMin} min · ${driver.category} · ${paymentMethod}`);

  await notifyDriver(driver, tripRef.id, metrics);
}

main().catch((error) => {
  console.error(`No se pudo crear la solicitud: ${error.message}`);
  process.exitCode = 1;
});
