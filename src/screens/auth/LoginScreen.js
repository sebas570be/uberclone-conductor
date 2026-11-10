// src/screens/auth/LoginScreen.js
// Formulario de inicio de sesión y creación de cuenta (correo y contraseña).
// Regla del enunciado: los errores van DEBAJO de cada campo, nunca en Alert.
// Al iniciar sesión o crear la cuenta no hace falta navegar: el SessionContext
// detecta el usuario y RootNavigator cambia de pantalla solo.
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { signIn, signUp, getAuthErrorMessage } from '../../services/authService';
import { isValidEmail } from '../../utils/validators';

const MIN_PASSWORD_LENGTH = 6; // mínimo que exige Firebase Authentication

export default function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false); // false = iniciar sesión, true = crear cuenta
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({}); // { email, password }: error de cada campo
  const [formError, setFormError] = useState(null); // error que devuelve Firebase
  const [isLoading, setIsLoading] = useState(false);

  // Valida antes de llamar a Firebase: así el usuario ve el error al instante
  // y no se gasta una petición en datos que ya sabemos que son inválidos.
  const validate = () => {
    const newErrors = {};
    if (!isValidEmail(email)) {
      newErrors.email = 'Escribe un correo válido (ejemplo: nombre@gmail.com).';
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      newErrors.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!validate()) return;

    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      // finally: el botón se reactiva tanto si salió bien como si falló
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp((current) => !current);
    setErrors({});
    setFormError(null);
  };

  return (
    // Antes había un KeyboardAvoidingView: en iOS el teclado cambia de altura al
    // escribir (barra de sugerencias y de contraseñas) y la pantalla brincaba con
    // cada tecla. automaticallyAdjustKeyboardInsets solo ajusta el área de scroll,
    // sin mover el diseño (igual que en las pestañas del registro).
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
    >
      <Text style={styles.title}>{isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}</Text>
      <Text style={styles.subtitle}>UberClone · Conductor</Text>

      <Text style={styles.label}>Correo</Text>
      <TextInput
        style={[styles.input, errors.email && styles.inputError]}
        value={email}
        onChangeText={setEmail}
        placeholder="nombre@gmail.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="done"
        accessibilityLabel="Correo"
      />
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

      <Text style={styles.label}>Contraseña</Text>
      <TextInput
        style={[styles.input, errors.password && styles.inputError]}
        value={password}
        onChangeText={setPassword}
        placeholder="Mínimo 6 caracteres"
        secureTextEntry
        autoCapitalize="none"
        // iOS: le dice qué tipo de campo es (contraseña guardada o nueva), así
        // no cambia la barra de sugerencias a cada rato.
        textContentType={isSignUp ? 'newPassword' : 'password'}
        autoComplete={isSignUp ? 'new-password' : 'current-password'}
        returnKeyType="done"
        accessibilityLabel="Contraseña"
      />
      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

      <Pressable
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
        accessibilityRole="button"
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>{isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}</Text>
        )}
      </Pressable>

      {formError && <Text style={styles.errorText}>{formError}</Text>}

      <Pressable onPress={toggleMode} disabled={isLoading} accessibilityRole="button">
        <Text style={styles.link}>
          {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Crea una'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 24,
    fontSize: 14,
    color: '#6B7280',
  },
  label: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#DC2626',
  },
  errorText: {
    marginTop: 6,
    fontSize: 13,
    color: '#DC2626',
  },
  button: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  link: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 14,
    color: '#2563EB',
  },
});
