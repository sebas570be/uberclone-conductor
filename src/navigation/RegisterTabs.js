// src/navigation/RegisterTabs.js
// Tabs del registro (enunciado §2): las 3 pestañas del formulario del conductor.
// RegistrationProvider envuelve las 3 pestañas para que compartan el mismo
// estado del formulario.
// Las pestañas se llenan en orden: no se puede avanzar a una pestaña si la
// anterior tiene errores, pero sí se puede volver a una anterior.
// AI-assisted: see docs/AI_LOG.md #3
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SignOutButton from '../components/SignOutButton';
import { RegistrationProvider } from '../context/RegistrationContext';
import useRegistration from '../hooks/useRegistration';
import { hasErrors } from '../utils/registrationErrors';
import { PERSONAL_DATA_FIELDS, VEHICLE_FIELDS } from '../constants/registrationFields';
import PersonalDataScreen from '../screens/register/PersonalDataScreen';
import VehicleScreen from '../screens/register/VehicleScreen';
import DocumentsScreen from '../screens/register/DocumentsScreen';

const Tab = createBottomTabNavigator();

export default function RegisterTabs() {
  return (
    <RegistrationProvider>
      <RegisterTabNavigator />
    </RegistrationProvider>
  );
}

// Componente aparte porque useRegistration solo funciona DENTRO del Provider.
function RegisterTabNavigator() {
  const { personalDataErrors, vehicleErrors, touchFields } = useRegistration();

  const isPersonalDataComplete = !hasErrors(personalDataErrors);
  const isVehicleComplete = !hasErrors(vehicleErrors);

  // Al tocar una pestaña bloqueada: se cancela el cambio (preventDefault), se
  // lleva al conductor a la primera pestaña incompleta y se muestran sus errores.
  const blockUntilComplete = (canEnter) => ({ navigation }) => ({
    tabPress: (event) => {
      if (canEnter) return;
      event.preventDefault();
      if (!isPersonalDataComplete) {
        touchFields(PERSONAL_DATA_FIELDS);
        navigation.navigate('PersonalData');
      } else {
        touchFields(VEHICLE_FIELDS);
        navigation.navigate('Vehicle');
      }
    },
  });

  // Pestaña bloqueada: se ve más clara y el lector de pantalla dice por qué.
  const lockedOptions = (title, isLocked, requirement) => ({
    title,
    tabBarItemStyle: isLocked ? { opacity: 0.4 } : undefined,
    tabBarAccessibilityLabel: isLocked ? `${title}, bloqueada: primero completa ${requirement}` : title,
  });

  return (
    // "Salir" en el encabezado: en el registro todavía no hay menú para cerrar sesión.
    <Tab.Navigator screenOptions={{ headerRight: () => <SignOutButton /> }}>
      <Tab.Screen name="PersonalData" component={PersonalDataScreen} options={{ title: 'Datos personales' }} />
      <Tab.Screen
        name="Vehicle"
        component={VehicleScreen}
        options={lockedOptions('Vehículo', !isPersonalDataComplete, 'Datos personales')}
        listeners={blockUntilComplete(isPersonalDataComplete)}
      />
      <Tab.Screen
        name="Documents"
        component={DocumentsScreen}
        options={lockedOptions('Documentos', !(isPersonalDataComplete && isVehicleComplete), 'Datos personales y Vehículo')}
        listeners={blockUntilComplete(isPersonalDataComplete && isVehicleComplete)}
      />
    </Tab.Navigator>
  );
}
