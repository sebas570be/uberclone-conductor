# Arquitectura — UberClone Versión Conductor

## Capas y regla de dependencias

```
screens / components   →  dibujan y reciben eventos del usuario
        ↓ usan
hooks / context        →  estado de la app y lógica de cada pantalla
        ↓ llaman
services               →  ÚNICO lugar que habla con el exterior
        ↓
Firebase (Auth, Firestore) · backend (Express) · Cloudinary · OSRM · AsyncStorage · GPS · notificaciones
```

Reglas:
1. Una pantalla **nunca** llama a Firebase, `fetch` o AsyncStorage directamente: pasa por un hook o un service.
2. `utils/` contiene funciones puras (sin red, sin estado): por eso se prueban con Jest sin simular nada.
3. `config/` concentra los valores que pueden cambiar (tarifas, comisión, tiempos, URLs). Cambiar la comisión es tocar un solo archivo.
4. Los secretos (token de Mercado Pago y cuenta de servicio de Firebase) viven **solo** en el backend (`backend/.env` y `backend/serviceAccountKey.json`, fuera de Git), nunca en la app. La llave de Google Maps para Android sí va dentro de la APK (Maps la necesita), por eso está restringida al paquete y a la huella SHA-1 de la app.

## Carpetas de la app (`src/`)

| Carpeta | Responsabilidad | Archivos |
|---|---|---|
| `config/` | Configuración centralizada | `pricing.js` (tarifas y comisión), `firebase.js`, `cloudinary.js`, `api.js` (backend), `routes.js` (OSRM), `location.js`, `tripRequest.js` (estados y 15 s), `history.js` (20 por carga), `registration.js`, `push.js` |
| `navigation/` | Árbol de navegación | `RootNavigator.js` (según el estado del conductor), `RegisterTabs.js` (Tabs del registro), `MainDrawer.js` (Drawer), `TripStack.js` (Stack del viaje), `HistoryStack.js`, `ProfileStack.js` |
| `screens/` | Pantallas por flujo | `auth/` (inicio de sesión), `register/` (3 pestañas + pendiente), `main/` (Inicio, Solicitud, Viaje, Cobro, Historial, Detalle, Ganancias, Perfil, Editar perfil, Configuración) |
| `components/` | Piezas de UI reutilizables | `TextField`, `SelectField`, `DateField`, `PhotoField`, `CheckboxField`, `FormField`, `SignOutButton` |
| `context/` | Estado global | `SessionContext` (sesión y estado del conductor), `ActiveTripContext` (viaje activo), `RegistrationContext` (formulario de 3 pestañas), `LanguageContext` (idioma) |
| `hooks/` | Hooks personalizados | `useDriverLocation`, `useTripRequests`, `useEarnings`, `useFinishedTrips`, `usePushNotifications`, `useSession`, `useActiveTrip`, `useRegistration`, `useLanguage` |
| `services/` | Acceso a datos y servicios externos | `authService`, `driverService`, `availabilityService`, `locationService`, `tripService`, `routeService`, `paymentService`, `photoService`, `preferencesService`, `pushService` |
| `utils/` | Funciones puras (con pruebas en `__tests__/`) | `calculateFare`, `validators`, `registrationErrors`, `driverDocument`, `driverProfile`, `locationDocument`, `tripRequestData`, `tripCompletion`, `earnings`, `dates`, `polyline`, `paymentRequest`, `pushSupport` |
| `constants/` | Valores fijos del dominio | `registrationFields.js`, `registrationOptions.js` |
| `i18n/` | Textos en español e inglés | `es.js`, `en.js`, `translate.js`, `labels.js` |

## Backend (`backend/`)

API Node/Express que guarda los secretos y hace lo que la app no debe hacer sola.

| Carpeta | Archivos |
|---|---|
| `src/` | `server.js`, `config.js`, `firebaseAdmin.js` |
| `src/routes/` | `payments.js` (crear y verificar el cobro de Mercado Pago) |
| `src/middleware/` | `requireAuth.js` (verifica el token de sesión de Firebase) |
| `src/services/` | `mercadoPagoService.js`, `tripPaymentService.js`, `routeService.js` (OSRM), `geocodingService.js` (Nominatim), `httpClient.js` |
| `src/utils/` | `payment.js`, `tripRequest.js`, `pushMessage.js` (funciones puras con pruebas en `test/`) |
| `scripts/` | `createTripRequest.js` (`npm run solicitud`: simula la app del pasajero y envía la notificación push) |

## Colecciones de Firestore

| Colección | Contenido | Quién escribe |
|---|---|---|
| `drivers/{uid}` | Registro del conductor y su `status` (`pending` / `approved`) | El conductor (validado por reglas); la aprobación, en la consola |
| `driverLocations/{uid}` | `isAvailable`, `location`, `updatedAt` | El conductor, solo si está aprobado |
| `trips/{tripId}` | Viaje (modelo del enunciado §6 + `routePolyline`) | El backend lo crea; el conductor cambia el estado según las reglas; el backend marca el pago de Mercado Pago |
| `pushTokens/{uid}` | Token FCM del celular | El conductor (solo el suyo) |

## Flujo del viaje (estados del campo `status`)

```
requested → accepted → driver_arriving → in_progress → completed → paid
```

- `rejected`: desde `requested`, si el conductor rechaza o vencen los 15 s. El enunciado lo menciona pero no lo lista entre los estados.
- `cancelled`: desde `accepted` o `driver_arriving`, es decir, antes de `in_progress`.
