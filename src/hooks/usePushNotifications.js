// src/hooks/usePushNotifications.js
// Registra este celular para recibir solicitudes por notificación push
// mientras el conductor aprobado tiene la sesión abierta (MainDrawer).
// - Si Android renueva el token, se vuelve a guardar.
// - Al tocar la notificación, la app va a Inicio, donde aparece la solicitud.
// Cleanup: al cerrar sesión (se desmonta el menú) se dejan de escuchar.
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import useSession from './useSession';
import useLanguage from './useLanguage';
import {
  canUsePush,
  registerForPush,
  savePushToken,
  onPushTokenChange,
  onNotificationOpened,
} from '../services/pushService';

export default function usePushNotifications() {
  const { user } = useSession();
  const { t } = useLanguage();
  const navigation = useNavigation();
  const uid = user?.uid;
  // Nombre del canal en Ajustes de Android, en el idioma del conductor.
  const channelName = t('push.channelName');

  useEffect(() => {
    if (!uid || !canUsePush()) return undefined;

    registerForPush(uid, channelName).catch((error) =>
      console.log('No se pudo registrar para notificaciones:', error?.code ?? error?.message)
    );
    const tokenSubscription = onPushTokenChange((token) =>
      savePushToken(uid, token).catch((error) => console.log('No se pudo guardar el token nuevo:', error?.code))
    );
    // MainDrawer es la pantalla "Main" del RootNavigator: se va a su pantalla "Start" (Inicio).
    const openSubscription = onNotificationOpened(() => navigation.navigate('Main', { screen: 'Start' }));

    // CLEANUP: dejar de escuchar.
    return () => {
      tokenSubscription.remove();
      openSubscription.remove();
    };
  }, [uid, channelName, navigation]);
}
