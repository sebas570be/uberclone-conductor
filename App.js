// App.js
// Jerarquía (de afuera hacia adentro):
// GestureHandlerRootView → SafeAreaProvider → SessionProvider → NavigationContainer → RootNavigator.
// - GestureHandlerRootView: necesario para los gestos (deslizar el Drawer).
// - SessionProvider va por encima de la navegación para que RootNavigator y
//   cualquier pantalla puedan leer el estado del conductor.
// AI-assisted: see docs/AI_LOG.md #3
import React from 'react';
import { StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { SessionProvider } from './src/context/SessionContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <SessionProvider>
          <NavigationContainer>
            <StatusBar style="dark" />
            <RootNavigator />
          </NavigationContainer>
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
