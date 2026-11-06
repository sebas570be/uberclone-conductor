// src/config/firebase.js
// Inicializa Firebase una sola vez y exporta la app, la base de datos y auth.
// La configuración se lee de las variables EXPO_PUBLIC_FIREBASE_* del .env.
// Estas llaves de la app web NO son secretas: lo que protege los datos son
// las reglas de seguridad de Firestore.
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Fail fast: si falta una variable del .env, avisar con un mensaje claro
// en vez de un error confuso de Firebase más adelante.
const missing = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);
if (missing.length > 0) {
  throw new Error(`Faltan variables de Firebase en el .env: ${missing.join(', ')}`);
}

// Con Fast Refresh este archivo puede ejecutarse otra vez: si la app ya
// existe se reutiliza, porque inicializarla dos veces da error.
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

// AI-assisted: see docs/AI_LOG.md #5
// Sesión persistente (decisión D14): la sesión se guarda en AsyncStorage con el
// método oficial de Firebase para React Native, así el conductor no tiene que
// iniciar sesión cada vez que abre la app. La alternativa (SecureStore) exige
// un adaptador propio por el límite de 2048 bytes y las claves con ":".
// initializeAuth solo puede llamarse una vez por app: con Fast Refresh la
// segunda llamada lanza "auth/already-initialized" y se reutiliza con getAuth.
function createAuth() {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch (error) {
    if (error.code === 'auth/already-initialized') {
      return getAuth(app);
    }
    throw error;
  }
}

export const auth = createAuth();
