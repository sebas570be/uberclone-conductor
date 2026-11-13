// src/services/authService.js
// Único lugar de la app que habla con Firebase Authentication. Las pantallas
// llaman a estas funciones y nunca usan Firebase directamente (arquitectura
// por capas): si mañana cambia el proveedor, solo cambia este archivo.
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { goOffline } from './availabilityService';
import { removePushToken } from './pushService';

// Los mensajes de error los elige la pantalla (LoginScreen, AUTH_ERROR_KEYS)
// en el idioma del conductor: aquí solo se lanza el error con su código.

// El correo se guarda sin espacios y en minúsculas para que "Ana@Gmail.com"
// y "ana@gmail.com" sean la misma cuenta.
function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export async function signUp(email, password) {
  const credential = await createUserWithEmailAndPassword(auth, normalizeEmail(email), password);
  return credential.user;
}

export async function signIn(email, password) {
  const credential = await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
  return credential.user;
}

export function signOut() {
  return firebaseSignOut(auth);
}

// Cerrar sesión del conductor (menú y Configuración). Primero "No disponible"
// y borrar el token de notificaciones (este celular deja de recibir
// solicitudes de esta cuenta), todavía con sesión para que las reglas lo
// permitan, y DESPUÉS signOut: si fuera al revés, las escrituras fallarían.
// No hace falta navegar: el SessionContext ve que no hay usuario y
// RootNavigator muestra el inicio de sesión.
export async function signOutDriver(uid) {
  if (uid) {
    await goOffline(uid).catch((error) => console.log('No se pudo marcar No disponible:', error?.code));
    await removePushToken(uid).catch((error) => console.log('No se pudo borrar el token de notificaciones:', error?.code));
  }
  await signOut();
}
