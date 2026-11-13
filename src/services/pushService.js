// src/services/pushService.js
// Notificaciones push (enunciado §7, Firebase Cloud Messaging). La app guarda
// el token de este celular en pushTokens/{uid} y el backend (npm run
// solicitud) envía la notificación con firebase-admin al crear una solicitud.
// Solo funciona en la APK de Android (ver utils/pushSupport.js).
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { PUSH } from '../config/push';
import { isPushSupported } from '../utils/pushSupport';

// Con la app abierta no se muestra la notificación: Inicio ya muestra la
// solicitud con su contador.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const canUsePush = () => isPushSupported(Platform.OS, Constants.executionEnvironment);

export function savePushToken(uid, token) {
  return setDoc(doc(db, 'pushTokens', uid), { token, platform: 'android', updatedAt: serverTimestamp() });
}

// Crea el canal, pide el permiso (Android 13 o superior lo pregunta; en
// versiones anteriores viene concedido) y guarda el token. Devuelve false si
// no se puede o el conductor no da el permiso.
export async function registerForPush(uid, channelName) {
  if (!canUsePush()) return false;
  await Notifications.setNotificationChannelAsync(PUSH.channelId, {
    name: channelName,
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
  });
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  if (status !== 'granted') return false;
  const { data: token } = await Notifications.getDevicePushTokenAsync();
  await savePushToken(uid, token);
  return true;
}

// Al cerrar sesión: este celular deja de recibir solicitudes de esta cuenta.
export function removePushToken(uid) {
  if (!uid || !canUsePush()) return Promise.resolve();
  return deleteDoc(doc(db, 'pushTokens', uid));
}

// Android puede renovar el token: hay que volver a guardarlo.
export function onPushTokenChange(listener) {
  return Notifications.addPushTokenListener(({ data }) => listener(data));
}

// El conductor tocó la notificación.
export function onNotificationOpened(listener) {
  return Notifications.addNotificationResponseReceivedListener(listener);
}
