// src/navigation/TripStack.js
// Stack del viaje (enunciado §3): Inicio → Solicitud → Viaje en curso → Cobro.
// Inicio y Solicitud ya son pantallas reales; las demás siguen provisionales.
// AI-assisted: see docs/AI_LOG.md #3 (esqueleto) y #11 (Solicitud)
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PlaceholderScreen from '../components/PlaceholderScreen';
import HomeScreen from '../screens/main/HomeScreen';
import TripRequestScreen from '../screens/main/TripRequestScreen';

const Stack = createNativeStackNavigator();

export default function TripStack() {
  return (
    <Stack.Navigator>
      {/* Home sin encabezado propio: usa el del Drawer (con el botón de menú) */}
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      {/* Solicitud: sin "atrás" (ni botón ni gesto). El conductor debe aceptar
          o rechazar; si saliera sin responder, la solicitud volvería a abrirse. */}
      <Stack.Screen
        name="TripRequest"
        component={TripRequestScreen}
        options={{ title: 'Nueva solicitud', headerBackVisible: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="TripInProgress"
        component={PlaceholderScreen}
        options={{ title: 'Viaje en curso' }}
        initialParams={{ next: 'TripSummary' }}
      />
      <Stack.Screen name="TripSummary" component={PlaceholderScreen} options={{ title: 'Cobro y resumen' }} />
    </Stack.Navigator>
  );
}
