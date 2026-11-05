// src/navigation/MainDrawer.js
// Drawer del conductor aprobado (enunciado F8): Inicio (con el TripStack),
// Historial, Ganancias y Perfil.
// AI-assisted: see docs/AI_LOG.md #3
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import TripStack from './TripStack';
import PlaceholderScreen from '../components/PlaceholderScreen';

const Drawer = createDrawerNavigator();

// Estar dentro del Drawer NO oculta el menú por sí solo: hay que bloquearlo.
// Mientras el conductor está en una pantalla del viaje (cualquiera distinta de
// Home) se quita el encabezado del Drawer y el gesto para abrir el menú.
function startOptions({ route }) {
  const focusedScreen = getFocusedRouteNameFromRoute(route) ?? 'Home';
  const isHome = focusedScreen === 'Home';
  return { title: 'Inicio', headerShown: isHome, swipeEnabled: isHome };
}

export default function MainDrawer() {
  return (
    <Drawer.Navigator>
      <Drawer.Screen name="Start" component={TripStack} options={startOptions} />
      <Drawer.Screen name="History" component={PlaceholderScreen} options={{ title: 'Historial' }} />
      <Drawer.Screen name="Earnings" component={PlaceholderScreen} options={{ title: 'Ganancias' }} />
      <Drawer.Screen name="Profile" component={PlaceholderScreen} options={{ title: 'Perfil y configuración' }} />
    </Drawer.Navigator>
  );
}
