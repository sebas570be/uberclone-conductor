// src/navigation/MainDrawer.js
// Drawer del conductor aprobado (enunciado F8): Inicio (con el TripStack),
// Historial, Ganancias y Perfil, y al final "Cerrar sesión".
// AI-assisted: see docs/AI_LOG.md #3
import React from 'react';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from '@react-navigation/drawer';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import TripStack from './TripStack';
import PlaceholderScreen from '../components/PlaceholderScreen';
import { signOut } from '../services/authService';

const Drawer = createDrawerNavigator();

// Estar dentro del Drawer NO oculta el menú por sí solo: hay que bloquearlo.
// Mientras el conductor está en una pantalla del viaje (cualquiera distinta de
// Home) se quita el encabezado del Drawer y el gesto para abrir el menú.
function startOptions({ route }) {
  const focusedScreen = getFocusedRouteNameFromRoute(route) ?? 'Home';
  const isHome = focusedScreen === 'Home';
  return { title: 'Inicio', headerShown: isHome, swipeEnabled: isHome };
}

// Contenido del menú: las pantallas de siempre (DrawerItemList) y debajo
// "Cerrar sesión". No hace falta navegar al login: al cerrar sesión, el
// SessionContext detecta que no hay usuario y RootNavigator cambia solo.
function DrawerContent(props) {
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <DrawerItem
        label="Cerrar sesión"
        labelStyle={{ color: '#DC2626' }}
        onPress={() => {
          signOut().catch((error) => console.log('Error al cerrar sesión:', error.code));
        }}
        accessibilityRole="button"
      />
    </DrawerContentScrollView>
  );
}

export default function MainDrawer() {
  return (
    <Drawer.Navigator drawerContent={(props) => <DrawerContent {...props} />}>
      <Drawer.Screen name="Start" component={TripStack} options={startOptions} />
      <Drawer.Screen name="History" component={PlaceholderScreen} options={{ title: 'Historial' }} />
      <Drawer.Screen name="Earnings" component={PlaceholderScreen} options={{ title: 'Ganancias' }} />
      <Drawer.Screen name="Profile" component={PlaceholderScreen} options={{ title: 'Perfil y configuración' }} />
    </Drawer.Navigator>
  );
}
