# Arquitectura — UberClone Versión Conductor

## Capas y regla de dependencias

```
screens / components   →  dibujan y reciben eventos del usuario
        ↓ usan
hooks / context        →  estado de la app y lógica de cada pantalla
        ↓ llaman
services               →  ÚNICO lugar que habla con el exterior
        ↓
Firebase · backend (Express) · Cloudinary · AsyncStorage · SecureStore · GPS
```

Reglas:
1. Una pantalla **nunca** llama a Firebase, `fetch` o AsyncStorage directamente: pasa por un hook o un service.
2. `utils/` contiene funciones puras (sin red, sin estado): por eso se pueden probar con Jest sin simular nada.
3. `config/` concentra los valores que pueden cambiar (tarifas, comisión, URLs). Cambiar la comisión es tocar un solo archivo.
4. Las llaves secretas (Mercado Pago, Google) viven **solo** en `backend/.env`, nunca en la app.

## Carpetas

| Carpeta | Responsabilidad | Ejemplos (se crean en commits siguientes) |
|---|---|---|
| `src/config/` | Configuración centralizada | `pricing.js`, `firebase.js`, `env.js` |
| `src/navigation/` | Árbol de navegación: Drawer + Stack del viaje + Tabs del registro | `RootNavigator.js`, `DrawerNavigator.js`, `TripStack.js`, `RegisterTabs.js` |
| `src/screens/` | Pantallas, agrupadas por funcionalidad | `register/`, `home/`, `trip/`, `history/`, `earnings/`, `profile/`, `auth/`, `dev/` |
| `src/components/` | Piezas de UI reutilizables | `FormField.js`, `SelectField.js`, `EmptyState.js` |
| `src/context/` | Estado global: sesión del conductor y viaje activo | `AuthContext.js`, `TripContext.js` |
| `src/hooks/` | Hooks personalizados exigidos | `useDriverLocation.js`, `useTripRequests.js`, `useEarnings.js` |
| `src/services/` | Acceso a datos y servicios externos | `tripsService.js`, `driversService.js`, `paymentsApi.js`, `preferences.js` |
| `src/utils/` | Funciones puras | `calculateFare.js`, `validators.js`, `dates.js` |
| `src/constants/` | Valores fijos del dominio | `tripStatus.js`, `categories.js`, `colors.js` |
| `src/i18n/` | Textos de la interfaz en español e inglés | `es.js`, `en.js` |
| `backend/` | API Node/Express: pagos (Mercado Pago), webhook y rutas (Google Routes API) | `src/index.js`, `.env.example` |
| `docs/` | Documentación: arquitectura, bitácora de IA, capturas | `AI_LOG.md`, `capturas/` |

## Flujo del viaje (estados del campo `status`)

```
requested → accepted → driver_arriving → in_progress → completed → paid
     └──────────── cancelled (antes de in_progress) ────────────┘
```
