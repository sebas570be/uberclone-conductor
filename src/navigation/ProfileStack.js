// src/navigation/ProfileStack.js
// Stack del perfil (enunciado §3.7): Perfil → Editar datos que requieren
// aprobación. El Perfil usa el encabezado del Drawer (con el botón de menú);
// la edición usa el del Stack (con el botón de atrás), igual que el Historial.
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/main/ProfileScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator>
      {/* title: iOS lo usa en el botón de volver si no hay headerBackTitle. */}
      <Stack.Screen name="ProfileHome" component={ProfileScreen} options={{ headerShown: false, title: 'Perfil' }} />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Editar perfil', headerBackTitle: 'Atrás' }}
      />
    </Stack.Navigator>
  );
}
