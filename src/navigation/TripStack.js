// src/navigation/TripStack.js
// Stack del viaje (enunciado §3): Inicio → Solicitud → Viaje en curso → Cobro.
// Cada pantalla provisional recibe en "next" la siguiente, para probar el flujo.
// AI-assisted: see docs/AI_LOG.md #3
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PlaceholderScreen from '../components/PlaceholderScreen';

const Stack = createNativeStackNavigator();

export default function TripStack() {
  return (
    <Stack.Navigator>
      {/* Home sin encabezado propio: usa el del Drawer (con el botón de menú) */}
      <Stack.Screen
        name="Home"
        component={PlaceholderScreen}
        options={{ headerShown: false }}
        initialParams={{ next: 'TripRequest' }}
      />
      <Stack.Screen
        name="TripRequest"
        component={PlaceholderScreen}
        options={{ title: 'Solicitud' }}
        initialParams={{ next: 'TripInProgress' }}
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
