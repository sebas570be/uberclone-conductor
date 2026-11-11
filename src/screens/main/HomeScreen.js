// src/screens/main/HomeScreen.js
// Pantalla Inicio del conductor aprobado (enunciado §3, S1): mapa con su
// ubicación actual y el interruptor Disponible / No disponible.
// Solo se llega aquí con status "approved" (RootNavigator), y las reglas de
// Firestore también lo exigen para escribir en driverLocations (R6).
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Switch, Pressable, ActivityIndicator, Linking, StyleSheet } from 'react-native';
import MapView from 'react-native-maps';
import { useIsFocused } from '@react-navigation/native';
import useSession from '../../hooks/useSession';
import useDriverLocation, { LOCATION_STATUS } from '../../hooks/useDriverLocation';
import { getLastAvailability, saveLastAvailability } from '../../services/preferencesService';

// Zoom del mapa (grados visibles): ~1 km a la redonda.
const MAP_DELTA = { latitudeDelta: 0.01, longitudeDelta: 0.01 };

export default function HomeScreen() {
  const { user } = useSession();
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

  const { position, status, retry } = useDriverLocation(isAvailable && isFocused && isPreferenceLoaded);

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
        <Text style={styles.message}>Buscando tu ubicación…</Text>
      </View>
    );
  }

  if (status === LOCATION_STATUS.DENIED || status === LOCATION_STATUS.UNAVAILABLE) {
    const isDenied = status === LOCATION_STATUS.DENIED;
    return (
      <View style={styles.center}>
        <Text style={styles.message}>
          {isDenied
            ? 'Sin permiso de ubicación. Actívalo en los Ajustes del celular para ver el mapa y recibir solicitudes.'
            : 'No se pudo obtener tu ubicación. Revisa que la ubicación (GPS) esté activada.'}
        </Text>
        {isDenied ? (
          <Pressable onPress={() => Linking.openSettings()} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.link}>Abrir Ajustes</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={retry} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.link}>Reintentar</Text>
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
        accessibilityLabel="Mapa con tu ubicación actual"
      />

      <View style={styles.panel}>
        <View style={styles.row}>
          <View style={styles.texts}>
            <Text style={styles.title}>{isAvailable ? 'Disponible' : 'No disponible'}</Text>
            <Text style={styles.subtitle}>
              {isAvailable
                ? 'Estás compartiendo tu ubicación y puedes recibir solicitudes.'
                : 'Activa para empezar a recibir solicitudes.'}
            </Text>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={handleToggle}
            disabled={!isPreferenceLoaded}
            accessibilityLabel="Disponible para recibir solicitudes"
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
