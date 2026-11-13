// src/config/api.js
// Dirección del backend de pagos, leída del .env. No es secreta: en Expo Go es
// la IP del PC en la red local. Si falta, NO se detiene la app (a diferencia
// de firebase.js): solo falla el cobro con Mercado Pago, con un mensaje claro.
export const API = Object.freeze({
  // Sin "/" al final, para armar las rutas sin dobles barras.
  baseUrl: (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, ''),
  requestTimeoutMs: 15000, // el backend a su vez espera hasta 10 s a Mercado Pago
});
