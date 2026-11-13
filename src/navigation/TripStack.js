// src/navigation/TripStack.js
// Stack del viaje (enunciado §3): Inicio → Solicitud → Viaje en curso → Cobro.
// AI-assisted: see docs/AI_LOG.md #3 (esqueleto) y #11 (Solicitud)
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useLanguage from '../hooks/useLanguage';
import HomeScreen from '../screens/main/HomeScreen';
import TripRequestScreen from '../screens/main/TripRequestScreen';
import TripInProgressScreen from '../screens/main/TripInProgressScreen';
import TripSummaryScreen from '../screens/main/TripSummaryScreen';

const Stack = createNativeStackNavigator();

export default function TripStack() {
  const { t } = useLanguage();

  return (
    <Stack.Navigator>
      {/* Home sin encabezado propio: usa el del Drawer (con el botón de menú) */}
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      {/* Solicitud: sin "atrás" (ni botón ni gesto). El conductor debe aceptar
          o rechazar; si saliera sin responder, la solicitud volvería a abrirse. */}
      <Stack.Screen
        name="TripRequest"
        component={TripRequestScreen}
        options={{ title: t('tripRequest.title'), headerBackVisible: false, gestureEnabled: false }}
      />
      {/* Viaje en curso: sin botón ni gesto de "atrás"; además usePreventRemove
          bloquea cualquier otra forma de salir mientras el viaje esté activo. */}
      <Stack.Screen
        name="TripInProgress"
        component={TripInProgressScreen}
        options={{ title: t('tripInProgress.title'), headerBackVisible: false, gestureEnabled: false }}
      />
      {/* Cobro y resumen: se sale con "Volver al inicio" (si el viaje no se
          ha cobrado, primero pide confirmación). Sin "atrás": volvería al
          viaje en curso, que ya terminó. */}
      <Stack.Screen
        name="TripSummary"
        component={TripSummaryScreen}
        options={{ title: t('tripSummary.title'), headerBackVisible: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
