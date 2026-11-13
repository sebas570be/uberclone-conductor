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

// Mensajes en español para los códigos de error de Firebase.
// Ojo: con la protección contra enumeración de correos (activa por defecto en
// proyectos nuevos), un correo inexistente y una contraseña equivocada dan el
// mismo código "auth/invalid-credential", para no revelar qué correos existen.
const ERROR_MESSAGES = {
  'auth/email-already-in-use': 'Ese correo ya tiene una cuenta.',
  'auth/invalid-email': 'El correo no es válido.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
  'auth/network-request-failed': 'Sin conexión. Revisa tu internet e intenta de nuevo.',
};

export function getAuthErrorMessage(error) {
  return ERROR_MESSAGES[error?.code] ?? 'Ocurrió un error inesperado. Intenta de nuevo.';
}

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
// (todavía con sesión, así las reglas lo permiten) y DESPUÉS signOut: si fuera
// al revés, la escritura fallaría y quedaría Disponible en la base de datos.
// No hace falta navegar: el SessionContext ve que no hay usuario y
// RootNavigator muestra el inicio de sesión.
export async function signOutDriver(uid) {
  if (uid) {
    await goOffline(uid).catch((error) => console.log('No se pudo marcar No disponible:', error?.code));
  }
  await signOut();
}
