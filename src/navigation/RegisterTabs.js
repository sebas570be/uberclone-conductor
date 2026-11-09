// src/navigation/RegisterTabs.js
// Tabs del registro (enunciado §2): las 3 pestañas del formulario del conductor.
// RegistrationProvider envuelve las 3 pestañas para que compartan el mismo
// estado del formulario.
// AI-assisted: see docs/AI_LOG.md #3
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import PlaceholderScreen from '../components/PlaceholderScreen';
import SignOutButton from '../components/SignOutButton';
import { RegistrationProvider } from '../context/RegistrationContext';
import PersonalDataScreen from '../screens/register/PersonalDataScreen';

const Tab = createBottomTabNavigator();

export default function RegisterTabs() {
  return (
    <RegistrationProvider>
      {/* "Salir" en el encabezado: en el registro todavía no hay menú para cerrar sesión. */}
      <Tab.Navigator screenOptions={{ headerRight: () => <SignOutButton /> }}>
        <Tab.Screen name="PersonalData" component={PersonalDataScreen} options={{ title: 'Datos personales' }} />
        <Tab.Screen name="Vehicle" component={PlaceholderScreen} options={{ title: 'Vehículo' }} />
        <Tab.Screen name="Documents" component={PlaceholderScreen} options={{ title: 'Documentos' }} />
      </Tab.Navigator>
    </RegistrationProvider>
  );
}
