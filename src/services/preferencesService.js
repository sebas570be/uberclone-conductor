// src/services/preferencesService.js
// Preferencias del conductor en AsyncStorage (enunciado: AsyncStorage solo para
// preferencias, como el idioma o el último estado de disponibilidad; nunca
// datos sensibles). Igual que en clase: clave con prefijo de la app,
// JSON.stringify/JSON.parse, try/catch y valor por defecto.
import AsyncStorage from '@react-native-async-storage/async-storage';

// La clave incluye el uid: si otro conductor entra en el mismo celular, no
// hereda el estado del anterior.
const availabilityKey = (uid) => `@uberclone_conductor:isAvailable:${uid}`;

export async function getLastAvailability(uid) {
  try {
    const saved = await AsyncStorage.getItem(availabilityKey(uid));
    return saved ? JSON.parse(saved) === true : false;
  } catch (error) {
    console.log('No se pudo leer la disponibilidad guardada:', error?.message);
    return false;
  }
}

export async function saveLastAvailability(uid, isAvailable) {
  try {
    await AsyncStorage.setItem(availabilityKey(uid), JSON.stringify(isAvailable));
  } catch (error) {
    console.log('No se pudo guardar la disponibilidad:', error?.message);
  }
}

// Idioma de la app: es del CELULAR (no del conductor), porque se necesita
// antes de iniciar sesión (pantalla de inicio de sesión).
const LANGUAGE_KEY = '@uberclone_conductor:language';

export async function getSavedLanguage() {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.log('No se pudo leer el idioma guardado:', error?.message);
    return null;
  }
}

export async function saveLanguage(language) {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, JSON.stringify(language));
  } catch (error) {
    console.log('No se pudo guardar el idioma:', error?.message);
  }
}
