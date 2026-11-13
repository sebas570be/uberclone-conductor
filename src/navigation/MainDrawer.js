// src/navigation/MainDrawer.js
// Drawer del conductor aprobado (enunciado F8): Inicio (con el TripStack),
// Historial, Ganancias, Perfil y Configuración, y al final "Cerrar sesión".
// Los títulos salen del idioma elegido (useLanguage).
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
import SettingsScreen from '../screens/main/SettingsScreen';
import { signOutDriver } from '../services/authService';
import useSession from '../hooks/useSession';
import useLanguage from '../hooks/useLanguage';
import { ActiveTripProvider } from '../context/ActiveTripContext';

const Drawer = createDrawerNavigator();

// Estar dentro del Drawer NO oculta el menú por sí solo: hay que bloquearlo.
// Mientras el conductor está en una pantalla del viaje (cualquiera distinta de
// Home) se quita el encabezado del Drawer y el gesto para abrir el menú.
function startOptions({ route }) {
  const focusedScreen = getFocusedRouteNameFromRoute(route) ?? 'Home';
  const isHome = focusedScreen === 'Home';
  return { headerShown: isHome, swipeEnabled: isHome };
}

// Historial: el encabezado y el gesto del Drawer solo en la lista; en el
// detalle se ocultan para que se vea el botón de atrás del Stack y el gesto
// de deslizar a la derecha vuelva a la lista (como en Inicio).
function historyOptions({ route }) {
  const isList = (getFocusedRouteNameFromRoute(route) ?? 'HistoryList') === 'HistoryList';
  return { headerShown: isList, swipeEnabled: isList };
}

// Perfil: lo mismo que Historial (encabezado y gesto del Drawer solo en el Perfil).
function profileOptions({ route }) {
  const isHome = (getFocusedRouteNameFromRoute(route) ?? 'ProfileHome') === 'ProfileHome';
  return { headerShown: isHome, swipeEnabled: isHome };
}

// Contenido del menú: las pantallas de siempre (DrawerItemList) y debajo
// "Cerrar sesión" (la misma función de Configuración: primero No disponible,
// después signOut). No hace falta navegar al login: RootNavigator cambia solo.
function DrawerContent(props) {
  const { user } = useSession();
  const { t } = useLanguage();

  const handleSignOut = () => {
    signOutDriver(user?.uid).catch((error) => console.log('Error al cerrar sesión:', error?.code));
  };

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <DrawerItem
        label={t('drawer.signOut')}
        labelStyle={{ color: '#DC2626' }}
        onPress={handleSignOut}
        accessibilityRole="button"
      />
    </DrawerContentScrollView>
  );
}

export default function MainDrawer() {
  const { t } = useLanguage();

  return (
    <ActiveTripProvider>
      <Drawer.Navigator drawerContent={(props) => <DrawerContent {...props} />}>
        <Drawer.Screen
          name="Start"
          component={TripStack}
          options={(props) => ({ ...startOptions(props), title: t('drawer.start') })}
        />
        <Drawer.Screen
          name="History"
          component={HistoryStack}
          options={(props) => ({ ...historyOptions(props), title: t('drawer.history') })}
        />
        <Drawer.Screen name="Earnings" component={EarningsScreen} options={{ title: t('drawer.earnings') }} />
        <Drawer.Screen
          name="Profile"
          component={ProfileStack}
          options={(props) => ({ ...profileOptions(props), title: t('drawer.profile') })}
        />
        <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: t('drawer.settings') }} />
      </Drawer.Navigator>
    </ActiveTripProvider>
  );
}
