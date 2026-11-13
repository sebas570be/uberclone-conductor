// app.config.js
// Configuración dinámica: toma app.json y le agrega la llave de Google Maps
// para Android desde una variable de entorno (app.json no puede leer
// variables). En Expo Go no hace falta: Expo pone su propia llave.
export default ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    // google-services.json (notificaciones push con FCM): en EAS es una
    // variable de tipo archivo (GOOGLE_SERVICES_JSON); en el PC, el archivo de
    // la raíz. No se sube a Git.
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
  },
  plugins: [
    ...config.plugins,
    ['react-native-maps', { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY }],
  ],
});
