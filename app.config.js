// app.config.js
// Configuración dinámica: toma app.json y le agrega la llave de Google Maps
// para Android desde una variable de entorno (app.json no puede leer
// variables). En Expo Go no hace falta: Expo pone su propia llave.
export default ({ config }) => ({
  ...config,
  plugins: [
    ...config.plugins,
    ['react-native-maps', { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY }],
  ],
});
