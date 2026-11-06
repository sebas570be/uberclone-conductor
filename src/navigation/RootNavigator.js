// src/navigation/RootNavigator.js
// Navegación raíz: según el estado del conductor (SessionContext) solo existe
// una de las ramas. Un conductor que no está "approved" nunca tiene el Drawer
// montado, así que no puede llegar a Inicio ni ponerse disponible (enunciado §2).
// AI-assisted: see docs/AI_LOG.md #3
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useSession from '../hooks/useSession';
import { DRIVER_STATUS } from '../context/SessionContext';
import RegisterTabs from './RegisterTabs';
import MainDrawer from './MainDrawer';
import PlaceholderScreen from '../components/PlaceholderScreen';
import LoginScreen from '../screens/auth/LoginScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { driverStatus } = useSession();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {driverStatus === DRIVER_STATUS.SIGNED_OUT && (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
      {driverStatus === DRIVER_STATUS.UNREGISTERED && (
        <Stack.Screen name="Register" component={RegisterTabs} />
      )}
      {driverStatus === DRIVER_STATUS.PENDING && (
        <Stack.Screen
          name="Pending"
          component={PlaceholderScreen}
          options={{ headerShown: true, title: 'Pendiente de aprobación' }}
        />
      )}
      {driverStatus === DRIVER_STATUS.APPROVED && <Stack.Screen name="Main" component={MainDrawer} />}
    </Stack.Navigator>
  );
}
