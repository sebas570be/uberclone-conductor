// src/config/push.js
// Notificaciones push en un solo lugar (como location.js).
export const PUSH = Object.freeze({
  // Canal de Android de las solicitudes (importancia alta: suena y aparece
  // arriba). El backend envía con este mismo id (backend/src/config.js).
  channelId: 'trip-requests',
});
