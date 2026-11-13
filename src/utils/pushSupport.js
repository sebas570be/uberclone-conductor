// src/utils/pushSupport.js
// ¿Este celular puede recibir notificaciones push? (función pura: se prueba sola)
// - Solo Android: en iPhone exigen una cuenta Apple Developer de pago.
// - No en Expo Go ('storeClient'): desde SDK 53 no recibe push; sí la APK.
export function isPushSupported(platformOS, executionEnvironment) {
  return platformOS === 'android' && executionEnvironment !== 'storeClient';
}
