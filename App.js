// App.js
// Jerarquía (de afuera hacia adentro):
// GestureHandlerRootView → SafeAreaProvider → SessionProvider → LanguageProvider → NavigationContainer → RootNavigator.
// - GestureHandlerRootView: necesario para los gestos (deslizar el Drawer).
// - SessionProvider va por encima de la navegación para que RootNavigator y
//   cualquier pantalla puedan leer el estado del conductor.
// - LanguageProvider va dentro de SessionProvider: si el celular no tiene un
//   idioma guardado, usa el del registro del conductor.
// AI-assisted: see docs/AI_LOG.md #3
import React from 'react';
import { StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { SessionProvider } from './src/context/SessionContext';
import { LanguageProvider } from './src/context/LanguageContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <SessionProvider>
          <LanguageProvider>
            <NavigationContainer>
              <StatusBar style="dark" />
              <RootNavigator />
            </NavigationContainer>
          </LanguageProvider>
        </SessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
