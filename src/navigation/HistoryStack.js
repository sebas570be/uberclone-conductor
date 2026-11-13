// src/navigation/HistoryStack.js
// Stack del historial (enunciado §6): lista de viajes → detalle de un viaje.
// La lista usa el encabezado del Drawer (con el botón de menú); el detalle
// usa el del Stack (con el botón de atrás).
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HistoryScreen from '../screens/main/HistoryScreen';
import TripDetailScreen from '../screens/main/TripDetailScreen';

const Stack = createNativeStackNavigator();

export default function HistoryStack() {
  return (
    <Stack.Navigator>
      {/* title: iOS lo usa en el botón de volver si no hay headerBackTitle. */}
      <Stack.Screen name="HistoryList" component={HistoryScreen} options={{ headerShown: false, title: 'Historial' }} />
      <Stack.Screen
        name="TripDetail"
        component={TripDetailScreen}
        options={{ title: 'Detalle del viaje', headerBackTitle: 'Atrás' }}
      />
    </Stack.Navigator>
  );
}
