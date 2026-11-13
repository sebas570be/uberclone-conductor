// src/screens/main/HomeScreen.js
// Pantalla Inicio del conductor aprobado (enunciado §3, S1): mapa con su
// ubicación actual y el interruptor Disponible / No disponible.
// Solo se llega aquí con status "approved" (RootNavigator), y las reglas de
// Firestore también lo exigen para escribir en driverLocations (R6).
// Mientras está Disponible escucha las solicitudes (useTripRequests) y, cuando
// llega una, abre la pantalla Solicitud. Si hay un viaje activo (aceptado o en
// curso), no se pone Disponible y abre la pantalla Viaje en curso.
// Textos en el idioma elegido (useLanguage).
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Switch, Pressable, ActivityIndicator, Linking, StyleSheet } from 'react-native';
import MapView from 'react-native-maps';
import { useIsFocused } from '@react-navigation/native';
import useSession from '../../hooks/useSession';
import useDriverLocation, { LOCATION_STATUS } from '../../hooks/useDriverLocation';
import useTripRequests from '../../hooks/useTripRequests';
import useActiveTrip from '../../hooks/useActiveTrip';
import useLanguage from '../../hooks/useLanguage';
import { getLastAvailability, saveLastAvailability } from '../../services/preferencesService';

// Zoom del mapa (grados visibles): ~1 km a la redonda.
const MAP_DELTA = { latitudeDelta: 0.01, longitudeDelta: 0.01 };

export default function HomeScreen({ navigation }) {
  const { user } = useSession();
  const { t } = useLanguage();
  const uid = user?.uid;
  // En el Drawer esta pantalla NO se desmonta al ir a otra: useIsFocused dice
  // si está a la vista, para dejar de enviar la ubicación al salir de Inicio.
  const isFocused = useIsFocused();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isPreferenceLoaded, setIsPreferenceLoaded] = useState(false);

  // Último estado del interruptor (AsyncStorage), al abrir la pantalla.
  useEffect(() => {
    if (!uid) return undefined;
    let isMounted = true;
    getLastAvailability(uid).then((saved) => {
      if (!isMounted) return;
      setIsAvailable(saved);
      setIsPreferenceLoaded(true);
    });
    return () => {
      isMounted = false;
    };
  }, [uid]);

  // Viaje activo: mientras se sabe si hay uno (isTripLoading) o mientras exista,
  // Inicio no envía ubicación ni escucha solicitudes.
  const { activeTrip, isLoading: isTripLoading } = useActiveTrip();
  const canWork = isFocused && isPreferenceLoaded && !isTripLoading && !activeTrip;

  const { position, status, retry } = useDriverLocation(isAvailable && canWork);

  // Solicitudes: solo se escuchan con la misma condición con la que se envía la
  // ubicación (Disponible, en Inicio y con GPS listo). Al abrir la Solicitud,
  // Inicio pierde el foco: deja de escuchar y de enviar ubicación, así no llega
  // una segunda solicitud mientras el conductor decide.
  const tripRequest = useTripRequests(isAvailable && canWork && status === LOCATION_STATUS.READY);

  useEffect(() => {
    if (tripRequest) navigation.navigate('TripRequest', { trip: tripRequest });
  }, [tripRequest, navigation]);

  // Hay un viaje activo (por ejemplo, la app se cerró a mitad del viaje):
  // se vuelve a la pantalla del viaje.
  useEffect(() => {
    if (activeTrip && isFocused) navigation.navigate('TripInProgress');
  }, [activeTrip, isFocused, navigation]);

  // useCallback: la función no se recrea en cada render (se pasa al Switch).
  const handleToggle = useCallback(
    (value) => {
      setIsAvailable(value);
      saveLastAvailability(uid, value);
    },
    [uid]
  );

  if (status === LOCATION_STATUS.LOADING) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.message}>{t('home.searching')}</Text>
      </View>
    );
  }

  if (status === LOCATION_STATUS.DENIED || status === LOCATION_STATUS.UNAVAILABLE) {
    const isDenied = status === LOCATION_STATUS.DENIED;
    return (
      <View style={styles.center}>
        <Text style={styles.message}>
          {isDenied ? t('home.permissionDenied') : t('home.locationUnavailable')}
        </Text>
        {isDenied ? (
          <Pressable onPress={() => Linking.openSettings()} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.link}>{t('home.openSettings')}</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={retry} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.link}>{t('home.retry')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <MapView
        style={styles.map}
        initialRegion={{ ...position, ...MAP_DELTA }}
        showsUserLocation // punto azul con la ubicación del celular
        followsUserLocation // iOS: el mapa sigue al conductor
        accessibilityLabel={t('home.map')}
      />

      <View style={styles.panel}>
        <View style={styles.row}>
          <View style={styles.texts}>
            <Text style={styles.title}>{isAvailable ? t('home.available') : t('home.unavailable')}</Text>
            <Text style={styles.subtitle}>{isAvailable ? t('home.availableHint') : t('home.unavailableHint')}</Text>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={handleToggle}
            disabled={!isPreferenceLoaded}
            accessibilityLabel={t('home.switchLabel')}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  panel: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    // Sombra para que el panel se vea sobre el mapa
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  texts: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  message: {
    marginTop: 12,
    fontSize: 15,
    textAlign: 'center',
    color: '#374151',
  },
  link: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
  },
});
