// src/components/PlaceholderScreen.js
// Pantalla provisional del esqueleto de navegación: muestra el nombre de la
// ruta y, si la ruta trae el parámetro "next", un botón para ir a la siguiente.
// Cada una se reemplaza por la pantalla real cuando se construya su módulo.
// AI-assisted: see docs/AI_LOG.md #3
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export default function PlaceholderScreen({ route, navigation }) {
  const next = route.params?.next;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{route.name}</Text>
      <Text style={styles.subtitle}>Pantalla en construcción</Text>
      {next && (
        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate(next)}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Ir a {next}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  button: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#111827',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
