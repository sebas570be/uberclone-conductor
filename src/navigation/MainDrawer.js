// src/navigation/MainDrawer.js
// Drawer del conductor aprobado (enunciado F8): Inicio (con el TripStack),
// Historial, Ganancias y Perfil, y al final "Cerrar sesión".
// ActiveTripProvider envuelve el menú: el viaje activo solo existe para el
// conductor aprobado y cualquier pantalla del menú puede leerlo.
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
import EarningsScreen from '../screens/main/EarningsScreen';
import HistoryStack from './HistoryStack';
import ProfileStack from './ProfileStack';
import { signOut } from '../services/authService';
import { saveDriverLocation } from '../services/locationService';
import useSession from '../hooks/useSession';
import { ActiveTripProvider } from '../context/ActiveTripContext';

const Drawer = createDrawerNavigator();

// Estar dentro del Drawer NO oculta el menú por sí solo: hay que bloquearlo.
// Mientras el conductor está en una pantalla del viaje (cualquiera distinta de
// Home) se quita el encabezado del Drawer y el gesto para abrir el menú.
function startOptions({ route }) {
  const focusedScreen = getFocusedRouteNameFromRoute(route) ?? 'Home';
  const isHome = focusedScreen === 'Home';
  return { title: 'Inicio', headerShown: isHome, swipeEnabled: isHome };
}

// Historial: el encabezado y el gesto del Drawer solo en la lista; en el
// detalle se ocultan para que se vea el botón de atrás del Stack y el gesto
// de deslizar a la derecha vuelva a la lista (como en Inicio).
function historyOptions({ route }) {
  const isList = (getFocusedRouteNameFromRoute(route) ?? 'HistoryList') === 'HistoryList';
  return { title: 'Historial', headerShown: isList, swipeEnabled: isList };
}

// Perfil: lo mismo que Historial (encabezado y gesto del Drawer solo en el Perfil).
function profileOptions({ route }) {
  const isHome = (getFocusedRouteNameFromRoute(route) ?? 'ProfileHome') === 'ProfileHome';
  return { title: 'Perfil', headerShown: isHome, swipeEnabled: isHome };
}

// Contenido del menú: las pantallas de siempre (DrawerItemList) y debajo
// "Cerrar sesión". No hace falta navegar al login: al cerrar sesión, el
// SessionContext detecta que no hay usuario y RootNavigator cambia solo.
function DrawerContent(props) {
  const { user } = useSession();

  // Primero se marca "No disponible" (todavía con sesión, así las reglas lo
  // permiten) y DESPUÉS se cierra sesión. Si fuera al revés, la escritura
  // fallaría y el conductor quedaría como disponible en la base de datos.
  const handleSignOut = async () => {
    if (user?.uid) {
      await saveDriverLocation(user.uid, false, null).catch((error) =>
        console.log('No se pudo marcar No disponible:', error?.code)
      );
    }
    signOut().catch((error) => console.log('Error al cerrar sesión:', error.code));
  };

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <DrawerItem
        label="Cerrar sesión"
        labelStyle={{ color: '#DC2626' }}
        onPress={handleSignOut}
        accessibilityRole="button"
      />
    </DrawerContentScrollView>
  );
}

export default function MainDrawer() {
  return (
    <ActiveTripProvider>
      <Drawer.Navigator drawerContent={(props) => <DrawerContent {...props} />}>
        <Drawer.Screen name="Start" component={TripStack} options={startOptions} />
        <Drawer.Screen name="History" component={HistoryStack} options={historyOptions} />
        <Drawer.Screen name="Earnings" component={EarningsScreen} options={{ title: 'Ganancias' }} />
        <Drawer.Screen name="Profile" component={ProfileStack} options={profileOptions} />
      </Drawer.Navigator>
    </ActiveTripProvider>
  );
}
