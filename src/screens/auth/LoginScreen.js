// src/screens/auth/LoginScreen.js
// Formulario de inicio de sesión y creación de cuenta (correo y contraseña).
// Regla del enunciado: los errores van DEBAJO de cada campo, nunca en Alert.
// Al iniciar sesión o crear la cuenta no hace falta navegar: el SessionContext
// detecta el usuario y RootNavigator cambia de pantalla solo.
// Textos en el idioma elegido (useLanguage): el idioma se guarda en el celular,
// así que se conoce incluso antes de iniciar sesión.
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
import { signIn, signUp } from '../../services/authService';
import { isValidEmail } from '../../utils/validators';
import useLanguage from '../../hooks/useLanguage';

const MIN_PASSWORD_LENGTH = 6; // mínimo que exige Firebase Authentication

// Código de error de Firebase Authentication → clave del texto.
// Ojo: con la protección contra enumeración de correos (activa por defecto en
// proyectos nuevos), un correo inexistente y una contraseña equivocada dan el
// mismo código "auth/invalid-credential", para no revelar qué correos existen.
const AUTH_ERROR_KEYS = Object.freeze({
  'auth/email-already-in-use': 'auth.emailInUse',
  'auth/invalid-email': 'auth.invalidEmail',
  'auth/weak-password': 'auth.weakPassword',
  'auth/invalid-credential': 'auth.invalidCredential',
  'auth/too-many-requests': 'auth.tooManyRequests',
  'auth/network-request-failed': 'common.offlineError',
});
const authErrorKey = (error) => AUTH_ERROR_KEYS[error?.code] ?? 'auth.unknown';

export default function LoginScreen() {
  const { t } = useLanguage();
  const [isSignUp, setIsSignUp] = useState(false); // false = iniciar sesión, true = crear cuenta
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({}); // { email, password }: clave del error de cada campo
  const [formError, setFormError] = useState(null); // clave del error que devuelve Firebase
  const [isLoading, setIsLoading] = useState(false);

  // Valida antes de llamar a Firebase: así el usuario ve el error al instante
  // y no se gasta una petición en datos que ya sabemos que son inválidos.
  const validate = () => {
    const newErrors = {};
    if (!isValidEmail(email)) {
      newErrors.email = 'login.invalidEmail';
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      newErrors.password = 'login.shortPassword';
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
      setFormError(authErrorKey(error));
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
      <Text style={styles.title}>{isSignUp ? t('login.signUp') : t('login.signIn')}</Text>
      <Text style={styles.subtitle}>{t('login.subtitle')}</Text>

      <Text style={styles.label}>{t('fields.email')}</Text>
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
        accessibilityLabel={t('fields.email')}
      />
      {errors.email && <Text style={styles.errorText}>{t(errors.email)}</Text>}

      <Text style={styles.label}>{t('login.password')}</Text>
      <TextInput
        style={[styles.input, errors.password && styles.inputError]}
        value={password}
        onChangeText={setPassword}
        placeholder={t('login.passwordPlaceholder')}
        secureTextEntry
        autoCapitalize="none"
        // iOS: le dice qué tipo de campo es (contraseña guardada o nueva), así
        // no cambia la barra de sugerencias a cada rato.
        textContentType={isSignUp ? 'newPassword' : 'password'}
        autoComplete={isSignUp ? 'new-password' : 'current-password'}
        returnKeyType="done"
        accessibilityLabel={t('login.password')}
      />
      {errors.password && (
        <Text style={styles.errorText}>{t(errors.password, { min: MIN_PASSWORD_LENGTH })}</Text>
      )}

      <Pressable
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
        accessibilityRole="button"
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>{isSignUp ? t('login.signUp') : t('login.signIn')}</Text>
        )}
      </Pressable>

      {formError && <Text style={styles.errorText}>{t(formError)}</Text>}

      <Pressable onPress={toggleMode} disabled={isLoading} accessibilityRole="button">
        <Text style={styles.link}>
          {isSignUp ? t('login.toSignIn') : t('login.toSignUp')}
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
  // Contenido arriba (no centrado): si estuviera centrado, al abrirse el
  // teclado los campos quedaban tapados, porque automaticallyAdjustKeyboardInsets
  // solo agranda el área de scroll, no mueve el diseño.
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 72,
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
