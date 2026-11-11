// src/screens/main/TripInProgressScreen.js
// Viaje en curso (enunciado §3, S3): ruta al punto de recogida → "Pasajero a
// bordo" → ruta al destino → "Finalizar". Antes de que suba el pasajero se
// puede cancelar (E1).
// El viaje sale del ActiveTripContext (no de los parámetros de navegación):
// si la app se cierra a mitad del viaje, al abrirla se sigue desde aquí.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { usePreventRemove } from '@react-navigation/native';
import * as Location from 'expo-location';
import useActiveTrip from '../../hooks/useActiveTrip';
import { TRIP_STATUS } from '../../config/tripRequest';
import { updateTripStatus, cancelTrip, completeTrip } from '../../services/tripService';
import { getDrivingRoute } from '../../services/routeService';
import { decodePolyline } from '../../utils/polyline';
import { calculateFare } from '../../utils/calculateFare';
import { formatCop, paymentMethodLabel } from '../../utils/tripRequestData';

const MAP_PADDING = { top: 60, right: 40, bottom: 40, left: 40 };

// Mensaje para el conductor si una actualización del viaje falla.
function getUpdateErrorMessage(error) {
  if (error?.code === 'permission-denied') {
    return 'No se pudo actualizar el viaje: su estado ya cambió.';
  }
  return 'No se pudo actualizar el viaje. Revisa tu conexión e inténtalo de nuevo.';
}

export default function TripInProgressScreen({ navigation }) {
  const { activeTrip } = useActiveTrip();
  const mapRef = useRef(null);
  const [pickupRoute, setPickupRoute] = useState(null); // { points, distanceKm, durationMin }
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // Qué se hizo al final (completed / cancelled), con qué viaje y si el
  // SERVIDOR ya lo confirmó: cuando el viaje deja de estar activo, decide a
  // qué pantalla ir.
  const finishedRef = useRef(null);
  // Se cambia cuando el servidor confirma Finalizar/Cancelar, para que el
  // efecto de salida se vuelva a evaluar.
  const [confirmedAt, setConfirmedAt] = useState(0);
  // Viaje al que ya se le envió "va a recoger": evita enviarlo dos veces.
  const arrivingSentRef = useRef(null);
  // ¿Esta pantalla ya tuvo un viaje? Evita salir si al abrirla el contexto
  // todavía no ha cargado el viaje.
  const hadTripRef = useRef(false);
  if (activeTrip) hadTripRef.current = true;

  const isPickupPhase =
    activeTrip?.status === TRIP_STATUS.ACCEPTED || activeTrip?.status === TRIP_STATUS.DRIVER_ARRIVING;

  // Bloquear el regreso mientras haya viaje activo (botón atrás de Android,
  // gesto o navigation.goBack). Cuando el viaje termina, deja de bloquear.
  usePreventRemove(Boolean(activeTrip), () => {
    Alert.alert('Viaje en curso', 'Finaliza o cancela el viaje antes de salir.');
  });

  // Al abrir: "aceptado" pasa a "va a recoger" (driver_arriving).
  useEffect(() => {
    if (activeTrip?.status !== TRIP_STATUS.ACCEPTED) return;
    if (arrivingSentRef.current === activeTrip.id) return;
    arrivingSentRef.current = activeTrip.id;
    updateTripStatus(activeTrip.id, TRIP_STATUS.DRIVER_ARRIVING).catch((error) =>
      setErrorMessage(getUpdateErrorMessage(error))
    );
  }, [activeTrip?.id, activeTrip?.status]);

  // Ruta hasta el pasajero: UNA sola llamada por viaje (enunciado §7). Se
  // pide con la posición actual del conductor. Si falla, el mapa muestra
  // igual los puntos de recogida y destino.
  useEffect(() => {
    if (!isPickupPhase || !activeTrip) return undefined;
    let isCancelled = false;
    (async () => {
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        if (!permission.granted) return;
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const route = await getDrivingRoute(current.coords, {
          latitude: activeTrip.origin.lat,
          longitude: activeTrip.origin.lng,
        });
        if (!isCancelled) setPickupRoute(route);
      } catch (error) {
        console.log('No se pudo obtener la ruta hasta el pasajero:', error?.message);
      }
    })();
    // CLEANUP: si se sale antes de que llegue la respuesta, no se usa.
    return () => {
      isCancelled = true;
    };
    // Solo depende del viaje y la etapa: no se vuelve a pedir en cada render.
  }, [activeTrip?.id, isPickupPhase]);

  // Ruta del viaje (origen → destino), ya guardada en el documento.
  const tripRoutePoints = useMemo(
    () => decodePolyline(activeTrip?.routePolyline),
    [activeTrip?.routePolyline]
  );

  // Ruta que se dibuja según la etapa (useMemo: la misma lista mientras no
  // cambie, así el mapa no se reajusta en cada render).
  const visiblePoints = useMemo(
    () => (isPickupPhase ? pickupRoute?.points ?? [] : tripRoutePoints),
    [isPickupPhase, pickupRoute, tripRoutePoints]
  );

  // Ajustar el mapa a la ruta visible.
  useEffect(() => {
    if (visiblePoints.length > 1) {
      mapRef.current?.fitToCoordinates(visiblePoints, { edgePadding: MAP_PADDING, animated: true });
    }
  }, [visiblePoints]);

  // Estimación con la misma función del cobro (useMemo: solo cambia con el viaje).
  const estimate = useMemo(
    () =>
      activeTrip
        ? calculateFare({
            distanceKm: activeTrip.distanceKm,
            durationMin: activeTrip.durationMin,
            category: activeTrip.category,
          })
        : null,
    [activeTrip]
  );

  // Cuando el viaje deja de estar activo (finalizado o cancelado, desde aquí
  // o desde la base de datos), se sale de la pantalla. usePreventRemove ya no
  // bloquea porque activeTrip es null.
  // OJO: Firestore aplica la escritura en el celular ANTES de que el servidor
  // responda (compensación de latencia), así que activeTrip pasa a null
  // enseguida. Si el cambio salió de esta pantalla, se espera la confirmación
  // del servidor: si las reglas lo rechazan, el viaje vuelve y se muestra el
  // error aquí, en vez de haber salido a una pantalla equivocada.
  useEffect(() => {
    if (activeTrip || !hadTripRef.current) return;
    const finished = finishedRef.current;
    if (finished && !finished.confirmed) return; // esperando al servidor
    if (finished?.status === TRIP_STATUS.COMPLETED) {
      navigation.replace('TripSummary', { tripId: finished.tripId });
    } else {
      navigation.popToTop();
    }
  }, [activeTrip, navigation, confirmedAt]);

  // Ejecuta una acción del viaje mostrando carga y error (useCallback: no se
  // recrea en cada render).
  const runAction = useCallback(async (action) => {
    setIsSending(true);
    setErrorMessage('');
    try {
      await action();
      // El servidor confirmó. Si era Finalizar/Cancelar, ya se puede salir.
      if (finishedRef.current) {
        finishedRef.current.confirmed = true;
        setConfirmedAt(Date.now());
      }
    } catch (error) {
      finishedRef.current = null;
      setErrorMessage(getUpdateErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  }, []);

  const handlePassengerOnBoard = useCallback(() => {
    runAction(() => updateTripStatus(activeTrip.id, TRIP_STATUS.IN_PROGRESS));
  }, [activeTrip, runAction]);

  const handleFinish = useCallback(() => {
    finishedRef.current = { status: TRIP_STATUS.COMPLETED, tripId: activeTrip.id, confirmed: false };
    runAction(() => completeTrip(activeTrip));
  }, [activeTrip, runAction]);

  const handleCancel = useCallback(() => {
    Alert.alert('Cancelar viaje', '¿Seguro que quieres cancelar este viaje?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: () => {
          finishedRef.current = { status: TRIP_STATUS.CANCELLED, tripId: activeTrip.id, confirmed: false };
          runAction(() => cancelTrip(activeTrip.id));
        },
      },
    ]);
  }, [activeTrip, runAction]);

  if (!activeTrip) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const target = isPickupPhase ? activeTrip.origin : activeTrip.destination;
  const isWaitingStatus = activeTrip.status === TRIP_STATUS.ACCEPTED; // todavía no pasa a driver_arriving

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation
        initialRegion={{
          latitude: target.lat,
          longitude: target.lng,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
      >
        <Marker
          coordinate={{ latitude: activeTrip.origin.lat, longitude: activeTrip.origin.lng }}
          title="Recogida"
          pinColor="#15803D"
        />
        <Marker
          coordinate={{ latitude: activeTrip.destination.lat, longitude: activeTrip.destination.lng }}
          title="Destino"
          pinColor="#DC2626"
        />
        {visiblePoints.length > 1 ? (
          <Polyline coordinates={visiblePoints} strokeWidth={5} strokeColor="#2563EB" />
        ) : null}
      </MapView>

      <View style={styles.panel}>
        <Text style={styles.phase}>{isPickupPhase ? 'Ve a recoger al pasajero' : 'Lleva al pasajero a su destino'}</Text>
        <Text style={styles.address}>{target.address}</Text>
        {isPickupPhase && pickupRoute ? (
          <Text style={styles.detail}>
            A {pickupRoute.distanceKm} km · {pickupRoute.durationMin} min de ti
          </Text>
        ) : null}
        <Text style={styles.detail}>
          Viaje: {activeTrip.distanceKm} km · {activeTrip.durationMin} min · {paymentMethodLabel(activeTrip.paymentMethod)}
          {estimate ? ` · ${formatCop(estimate.fare)}` : ''}
        </Text>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        {isPickupPhase ? (
          <>
            <Pressable
              style={[styles.button, styles.primaryButton, (isSending || isWaitingStatus) && styles.disabled]}
              onPress={handlePassengerOnBoard}
              disabled={isSending || isWaitingStatus}
              accessibilityRole="button"
            >
              {isSending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Pasajero a bordo</Text>}
            </Pressable>
            <Pressable
              style={[styles.button, styles.cancelButton, isSending && styles.disabled]}
              onPress={handleCancel}
              disabled={isSending}
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>Cancelar viaje</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            style={[styles.button, styles.primaryButton, isSending && styles.disabled]}
            onPress={handleFinish}
            disabled={isSending}
            accessibilityRole="button"
          >
            {isSending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Finalizar viaje</Text>}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    flex: 1,
  },
  panel: {
    padding: 16,
    paddingBottom: 32,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  phase: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  address: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  detail: {
    marginTop: 6,
    fontSize: 14,
    color: '#4B5563',
  },
  error: {
    marginTop: 10,
    fontSize: 14,
    textAlign: 'center',
    color: '#DC2626',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 12,
    borderRadius: 10,
  },
  primaryButton: {
    backgroundColor: '#111827',
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    borderWidth: 2,
    borderColor: '#DC2626',
    backgroundColor: '#FFFFFF',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
  },
  disabled: {
    opacity: 0.5,
  },
});
