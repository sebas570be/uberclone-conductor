# UberClone — Versión Conductor

Aplicación móvil multiplataforma inspirada en Uber (versión conductor), desarrollada con React Native y Expo para la asignatura Desarrollo Móvil — Ingeniería de Software.

**Proyecto individual.** Autor: Fray Sebastián Benítez Rodríguez.

## Tecnologías

- Expo SDK 58 · React Native 0.88 · React 19.3 · JavaScript
- React Navigation 7 (Stack, Tabs y Drawer)
- Firebase: Authentication y Cloud Firestore (tiempo real y reglas de seguridad)
- Cloudinary (fotos del registro)
- `expo-location`, `react-native-maps`, OSRM y Nominatim (ubicación, mapa y rutas)
- Mercado Pago Checkout Pro en modo de prueba, con `expo-web-browser`
- `expo-notifications` + Firebase Cloud Messaging (notificaciones push)
- Backend: Node.js + Express 5 + `firebase-admin`
- Jest + jest-expo (app) y `node --test` (backend)
- EAS Build (APK de Android)

## Requisitos

- Node.js y npm
- Git
- App **Expo Go** (compatible con SDK 58) en el celular, en la misma red Wi-Fi que el computador
- El backend corriendo en el computador, para los pagos y para simular solicitudes (ver [backend/README.md](backend/README.md))
- Para las notificaciones push: la APK de Android (Expo Go no las recibe; ver la sección APK)

## Instalación y ejecución

```bash
git clone https://github.com/sebas570be/uberclone-conductor.git
cd uberclone-conductor
npm install
npx expo start
```

Escanea el código QR con Expo Go (Android) o con la cámara (iPhone).

En otras dos terminales, el backend (la configuración de la cuenta de servicio y de Mercado Pago está en [backend/README.md](backend/README.md)):

```bash
cd backend
npm install
npm start                    # servidor de pagos (puerto 3000)
npm run solicitud -- cash    # en otra terminal: simula una solicitud de viaje
```

## Pruebas

```bash
npm test                 # app: Jest + jest-expo
cd backend && npm test   # backend: node --test
```

## Variables de entorno

Las llaves **no se suben al repositorio**: van en archivos `.env`, que están en el `.gitignore`. Cada `.env.example` tiene los nombres de las variables sin valores; se copia como `.env` y se completa.

- **`.env` (raíz, la app):** configuración web de Firebase, Cloudinary (upload preset sin firma) y `EXPO_PUBLIC_API_URL`, la dirección del backend de pagos (en Expo Go, `http://IP-DEL-PC:3000`). Ninguno es secreto.
- **`backend/.env`:** ruta de la llave de la cuenta de servicio de Firebase y `MP_ACCESS_TOKEN` de Mercado Pago. **Son secretos**: solo viven en el PC. Ver [backend/README.md](backend/README.md).
- **Variables de EAS (para generar la APK):** las `EXPO_PUBLIC_*`, `GOOGLE_MAPS_ANDROID_API_KEY` (sensible; `app.config.js` la pone en la configuración del mapa) y `GOOGLE_SERVICES_JSON` (secreta, de tipo archivo: el `google-services.json` de Firebase para las notificaciones). Ni el `.env` ni `google-services.json` se suben a Git ni a EAS.

## Sesión

- Firebase Auth guarda la sesión con su método oficial para React Native (`getReactNativePersistence(AsyncStorage)`), así el conductor no inicia sesión cada vez que abre la app. Se descartó SecureStore porque limita cada valor a 2048 bytes y no acepta claves con ":", así que exigiría un adaptador propio.
- Lo demás que la app guarda en el celular son preferencias (idioma y último estado del interruptor), nunca datos sensibles.
- La app cambia de pantalla sola según el estado del conductor en `drivers/{uid}`: sin registro → registro; registro enviado → "Pendiente de aprobación"; aprobado → menú.

## Estructura del proyecto

La arquitectura por capas y la responsabilidad de cada carpeta están en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Reglas del registro no definidas en el enunciado

El enunciado deja cuatro reglas sin definir. Se fijaron estas (las tres primeras están en `src/config/registration.js` para cambiarlas en un solo lugar):

| Regla | Valor elegido | Justificación |
|---|---|---|
| Año mínimo del vehículo | 2000 | El enunciado solo pide "≤ año actual"; sin un mínimo se aceptaría un año como 0001. |
| Revisión técnico-mecánica "si aplica según el año" | Obligatoria si el vehículo tiene 5 años o más | En Colombia, los vehículos particulares nuevos hacen la primera revisión "a partir del sexto (6o) año" desde la matrícula (Ley 769 de 2002, art. 52, modificado por el Decreto Ley 019 de 2012, art. 202), es decir, cuando ya cumplieron 5 años. Se calcula con el año del modelo porque la app no pide la fecha de matrícula. |
| Capacidad mínima de Económico y Premium | 4 pasajeros | El enunciado solo fija el mínimo de XL (6). |
| Formato del número de licencia | Entre 6 y 10 números | En Colombia el número de la licencia de conducción es el mismo de la cédula; se usa la misma regla del documento. |

## Fotos del registro (Cloudinary)

Las fotos (perfil, vehículo, licencia, SOAT y revisión técnico-mecánica) se suben a Cloudinary al enviar el registro, con un *upload preset* **sin firma**. Así la app no lleva el API Secret. En Firestore se guarda solo la URL de cada foto.

Protecciones del preset: carpeta fija, solo `jpg` y `png`, sin sobrescribir y con nombre de archivo aleatorio (*Disallow public ID*).

**Riesgo aceptado:** las fotos de los documentos quedan en una URL pública. Es larga y aleatoria, imposible de adivinar, pero quien la tenga puede verla. Las URL solo se guardan en el documento del conductor, que las reglas de Firestore dejan leer únicamente al propio conductor. Mejora prevista: servirlas con URL privadas firmadas desde el backend.

## Ubicación en tiempo real

- **Librería:** `expo-location` (`watchPositionAsync`). El enunciado nombra `@react-native-community/geolocation`, pero es un módulo nativo que no funciona en Expo Go. `expo-location` es el módulo Expo equivalente, que es la herramienta del curso ("un módulo Expo seleccionado" para la ubicación, semanas 4 y 12 del microcurrículo), y funciona en Expo Go y en la APK.
- **Frecuencia:** el GPS avisa cada 20 m y la ubicación se escribe en Firestore cada 5 s mientras el conductor está Disponible y en la pantalla Inicio. En iOS `timeInterval` no tiene efecto; por eso el envío usa un intervalo propio.
- **Dónde se guarda:** colección aparte `driverLocations/{uid}` = `{ isAvailable, location, updatedAt }`. El registro (`drivers/{uid}`) no se reescribe cada 5 s, y quien necesite la ubicación no lee datos personales. Al pasar a No disponible, la ubicación se guarda en `null`.
- **Reglas:** solo el dueño lee y escribe; ponerse Disponible exige `status == 'approved'` en su registro (verificado en el servidor con `get()`).
- **Desconexión:** al cerrar sesión desde el menú, primero se marca No disponible y después se cierra la sesión. Si la app se cierra de golpe estando Disponible, el documento puede quedar con `isAvailable: true`; por eso la app considera desconectada una ubicación con `updatedAt` de más de 30 s. El script de solicitudes acepta hasta 5 minutos, para poder probar las notificaciones con la app en segundo plano (ver Notificaciones).
- **Segundo plano:** con la app minimizada, iOS pausa los temporizadores de JavaScript y el envío se detiene hasta volver a abrirla. Enviar en segundo plano exige tareas en segundo plano y permiso "Siempre", que quedan fuera de Expo Go.
- **Último estado del interruptor:** se guarda en AsyncStorage (`@uberclone_conductor:isAvailable:<uid>`), porque es una preferencia y no un dato sensible.

## Cobro (Mercado Pago y efectivo)

- **Pantalla Cobro y resumen:** al finalizar el viaje muestra tarifa, comisión (20 %), ganancia y estado del pago (Pendiente, Aprobado, Rechazado o Efectivo). Escucha el viaje en tiempo real: cambia sola cuando se cobra.
- **Efectivo:** "Recibí el efectivo" marca el viaje `paid` con `paymentStatus: "cash"`. Las reglas de Firestore solo lo permiten al conductor del viaje, si el viaje es en efectivo y está `completed`.
- **Mercado Pago (Checkout Pro, modo de prueba):** la app nunca habla con Mercado Pago. Le pide al backend (`backend/`, `npm start`) que cree el cobro, con el monto guardado en Firestore. El checkout se abre dentro de la app con `expo-web-browser`, y al cerrarlo el backend verifica el pago (monto y moneda) y marca el viaje como pagado. Un viaje de Mercado Pago no se puede marcar pagado desde la app.
- **Sin webhook:** el backend vive en la red local del PC, sin URL pública; el pago se verifica al volver del checkout, y también con el botón "Verificar pago".
- **Salir sin cobrar:** se permite con un aviso; el viaje queda `completed` (por cobrar).
- **Limitación conocida:** la app llama al backend por `http` en la red local (en la APK se permite con `usesCleartextTraffic`, ver la sección APK). En producción el backend debe estar en un servidor con `https`, porque el token de sesión viaja en cada llamada.

## Historial y ganancias

- **Ganancias:** Hoy, Semana (lunes a domingo) y Mes, con viajes pagados, total facturado, comisiones, propinas, ganancia neta y promedio por viaje. Se calculan en el hook `useEarnings` con `useMemo`.
- **Solo cuenta el dinero real:** los totales y el saldo usan solo los viajes `paid`. Los viajes que terminaron sin pagar se muestran aparte como **"Pendiente de pago"** y no se suman. En una app real la plataforma le cobraría al pasajero; queda fuera del alcance porque la app del pasajero no existe.
- **Saldo con la plataforma:** los viajes pagados con Mercado Pago suman la ganancia del conductor (la plataforma recibió el dinero); los pagados en efectivo restan la comisión (el conductor recibió el dinero). Puede quedar negativo.
- **Historial:** una sola escucha en tiempo real de los viajes terminados (`completed` y `paid`). Los filtros (Hoy, Semana, Mes, Rango de fechas y método de pago) y el orden se aplican en la app con `useMemo`, sin índices compuestos en Firestore. La `FlatList` muestra 20 viajes y carga 20 más al llegar al final.
- **Detalle del viaje:** ruta dibujada con `Polyline` desde la ruta guardada del viaje, distancia, duración, tarifa, comisión, propina y ganancia. La calificación aparece como "Sin calificación" porque no hay app del pasajero que califique.
- Los viajes cancelados o rechazados no aparecen: no cobran nada.

## Perfil, configuración e idioma

- **Perfil:** muestra los datos personales, el vehículo y los documentos; un documento vencido se ve en rojo. El celular y el correo de Mercado Pago se guardan directo, con las mismas validaciones del registro, y el conductor sigue aprobado.
- **Cambios que requieren una nueva aprobación:** la foto, el nombre, el género, el vehículo y los documentos se comparan con los documentos, así que se editan en "Editar identidad, vehículo o documentos". Antes de enviar se pide confirmación; el conductor queda No disponible y el registro vuelve a "Pendiente de aprobación" hasta que lo aprueben de nuevo (en la consola de Firebase). No se puede enviar con un viaje activo. El documento de identidad y la fecha de nacimiento no se pueden cambiar.
- **Reglas de Firestore:** si cambia algún dato de revisión, el único estado permitido es `pending`, y con documentos vigentes. Una app modificada no puede cambiar esos datos y seguir aprobada.
- **Idioma (español / inglés):** sin librerías, en `src/i18n` (`es.js`, `en.js` y `translate`). Se elige en Configuración o en el registro y cambia la app al instante. Se guarda en el celular (AsyncStorage) y en la cuenta (`drivers.language`). Firestore guarda códigos (`'gray'`, `'cash'`) y cada pantalla los traduce; los errores se guardan como clave, así un mensaje ya mostrado también cambia de idioma. Una prueba verifica que `es.js` y `en.js` tengan las mismas claves.
- **Cerrar sesión:** desde el menú o desde Configuración; primero se marca No disponible y después se cierra la sesión.
- **Limitación:** la página de pago de Mercado Pago sale en español (cuenta de Colombia); la controla Mercado Pago, no la app.

## APK (Android)

- **Instalar:** la APK se genera con EAS Build (distribución interna). En la página del build en expo.dev, **Install** muestra un QR con el enlace de descarga (válido 13 días). En Android hay que permitir "instalar apps de esta fuente" y, si aparece Play Protect, "Instalar de todas formas" (pasa con toda APK que no viene de la Play Store).
- **Generar:** `eas build -p android --profile preview`. El perfil `preview` de `eas.json` produce una APK de distribución interna con el entorno `preview` de EAS.
- **Variables:** el `.env` no se sube (ni a Git ni a EAS). Las `EXPO_PUBLIC_*` y `GOOGLE_MAPS_ANDROID_API_KEY` están como variables de entorno de EAS (entorno `preview`); `app.config.js` toma `app.json` y le agrega la llave de Maps, porque `app.json` no puede leer variables.
- **Identidad:** nombre "UberClone Conductor", paquete `com.sebas570be.uberclone.conductor`, versión 1.0.0 (`versionCode` 1), ícono propio (iOS y Android adaptativo) y pantalla inicial con `expo-splash-screen`.
- **Google Maps en Android:** la llave está restringida a esta app (paquete + huella SHA-1 del keystore de EAS) y solo a "Maps SDK for Android", con una alerta de presupuesto en Google Cloud (enunciado §7). En Expo Go no hace falta: Expo pone su propia llave.
- **Permisos mínimos:** ubicación, cámara y fotos. `RECORD_AUDIO` (que `expo-image-picker` agrega para grabar video) está bloqueado en `blockedPermissions`, porque la app solo toma fotos.
- **`http` en la red local:** Android bloquea el tráfico `http` en una APK; `expo-build-properties` lo permite (`usesCleartextTraffic`) para llegar al backend del PC. Solo sirve para la demo: en producción, `https`.
- **R8 desactivado:** la primera APK se cerraba al abrir. Con `adb logcat` se vio `Failed to create an instance of class androidx.work.impl.WorkDatabase`: R8 (el optimizador de los builds de release) eliminaba una clase que WorkManager busca por su nombre. Se desactivó con `enableMinifyInReleaseBuilds: false` (la APK pesa algo más).
- **Barra de navegación de Android:** las apps de Expo se dibujan detrás de esa barra (*edge-to-edge*); las pantallas del menú dejan su espacio con `SafeAreaView` (`screenLayout` del Drawer) para que no tape los botones.
- **Probada en** un POCO X3 Pro (Android 12): inicio de sesión, mapa, Disponible, solicitud, viaje y cobro con Mercado Pago aprobado (capturas 124–134).

## Notificaciones de solicitudes (push)

- **Para qué:** con la app en segundo plano o cerrada, el conductor Disponible recibe una notificación cuando le llega una solicitud. Al tocarla, la app abre en Inicio, donde aparece la solicitud con su temporizador.
- **Cómo:** Firebase Cloud Messaging (FCM) con `expo-notifications`. La app pide permiso, crea el canal "Solicitudes de viaje", obtiene el token FCM del celular (`getDevicePushTokenAsync`) y lo guarda en `pushTokens/{uid}`. El script de solicitudes (`npm run solicitud` en `backend/`) crea el viaje y envía la notificación con `firebase-admin`, en el idioma del conductor.
- **Vence con la solicitud:** la notificación dura 20 s (`ttl`). Si el celular está sin conexión más tiempo, ya no llega, porque la solicitud (15 s) ya venció.
- **Con la app abierta** no se muestra: la pantalla de la solicitud aparece sola (tiempo real).
- **Seguridad:** las reglas de Firestore solo dejan a cada conductor leer, escribir y borrar su propio token, con campos fijos. Al cerrar sesión se borra el token, y si FCM responde que el token ya no sirve, el backend borra el documento. `google-services.json` no está en Git: EAS lo recibe como variable secreta de tipo archivo (`GOOGLE_SERVICES_JSON`).
- **Conductor en segundo plano:** con la app minimizada la ubicación deja de enviarse, así que el script acepta conductores cuya última ubicación tenga hasta 5 minutos.
- **Limitaciones:** funciona solo en la APK de Android. Expo Go no recibe notificaciones push desde la SDK 53, e iOS exige una cuenta de Apple Developer de pago. El enunciado nombra `@react-native-firebase/messaging`; se usó `expo-notifications`, el módulo de Expo equivalente.
- **Probada en** el POCO X3 Pro (Android 12): con la app minimizada llega la notificación y, al tocarla, se abre la solicitud.

## Estado del desarrollo

- [x] Arquitectura por capas
- [x] Cálculo de tarifa, comisión y ganancia neta (`src/utils/calculateFare.js`) con pruebas
- [x] Inicio de sesión y creación de cuenta (Firebase Auth) con sesión en tiempo real según el estado del conductor
- [x] Registro del conductor (datos personales, vehículo, documentos y fotos) guardado en Firestore con estado pendiente
- [x] Reglas de seguridad de Firestore que validan el registro y la ubicación
- [x] Disponibilidad y ubicación en tiempo real
- [x] Solicitudes con tiempo límite
- [x] Navegación al punto de recogida y al destino
- [x] Cobro con Mercado Pago y en efectivo
- [x] Historial y resumen de ganancias
- [x] Perfil, configuración e idioma (español / inglés)
- [x] APK de Android con EAS Build (distribución interna)
- [x] Notificaciones push de nuevas solicitudes (FCM, APK de Android)

## Uso de IA

El uso de herramientas de inteligencia artificial está documentado en la bitácora [docs/AI_LOG.md](docs/AI_LOG.md).
