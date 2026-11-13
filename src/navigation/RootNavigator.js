// src/navigation/RootNavigator.js
// Navegación raíz: según el estado del conductor (SessionContext) solo existe
// una de las ramas. Un conductor que no está "approved" nunca tiene el Drawer
// montado, así que no puede llegar a Inicio ni ponerse disponible (enunciado §2).
// Textos en el idioma elegido (useLanguage).
// AI-assisted: see docs/AI_LOG.md #3
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useSession from '../hooks/useSession';
import useLanguage from '../hooks/useLanguage';
import { DRIVER_STATUS } from '../context/SessionContext';
import RegisterTabs from './RegisterTabs';
import MainDrawer from './MainDrawer';
import PendingScreen from '../screens/register/PendingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignOutButton from '../components/SignOutButton';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { driverStatus, isLoading, error } = useSession();
  const { t } = useLanguage();

  // Mientras Firebase confirma la sesión y el estado del conductor, se muestra
  // una carga: así no aparece el login por un instante a quien ya tenía sesión.
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  // Si no se pudo leer el estado (sin conexión, permisos), se explica y se
  // deja cerrar sesión, en vez de mostrar una pantalla que no corresponde.
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t(error)}</Text>
        <SignOutButton />
      </View>
    );
  }

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
          component={PendingScreen}
          options={{
            headerShown: true,
            title: t('pending.title'),
            headerRight: () => <SignOutButton />,
          }}
        />
      )}
      {driverStatus === DRIVER_STATUS.APPROVED && <Stack.Screen name="Main" component={MainDrawer} />}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    marginBottom: 16,
    fontSize: 15,
    textAlign: 'center',
    color: '#DC2626',
  },
});
