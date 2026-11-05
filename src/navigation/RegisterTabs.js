// src/navigation/RegisterTabs.js
// Tabs del registro (enunciado §2): las 3 pestañas del formulario del conductor.
// AI-assisted: see docs/AI_LOG.md #3
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import PlaceholderScreen from '../components/PlaceholderScreen';

const Tab = createBottomTabNavigator();

export default function RegisterTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="PersonalData" component={PlaceholderScreen} options={{ title: 'Datos personales' }} />
      <Tab.Screen name="Vehicle" component={PlaceholderScreen} options={{ title: 'Vehículo' }} />
      <Tab.Screen name="Documents" component={PlaceholderScreen} options={{ title: 'Documentos' }} />
    </Tab.Navigator>
  );
}
