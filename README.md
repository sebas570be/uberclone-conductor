# UberClone — Versión Conductor

Aplicación móvil multiplataforma inspirada en Uber (versión conductor), desarrollada con React Native y Expo para la asignatura Desarrollo Móvil — Ingeniería de Software.

**Proyecto individual.** Autor: Fray Sebastián Benítez Rodríguez.

## Tecnologías

- Expo SDK 58 · React Native 0.88 · React 19.3
- JavaScript
- Jest + jest-expo (pruebas unitarias)

## Requisitos

- Node.js y npm
- Git
- App **Expo Go** (compatible con SDK 58) en el celular, en la misma red que el computador

## Instalación y ejecución

```bash
git clone https://github.com/sebas570be/uberclone-conductor.git
cd uberclone-conductor
npm install
npx expo start
```

Escanea el código QR con Expo Go (Android) o con la cámara (iPhone).

## Pruebas

```bash
npm test
```

## Variables de entorno

Las llaves **no se suben al repositorio**: van en archivos `.env`, que están en el `.gitignore`. Cada `.env.example` tiene los nombres de las variables sin valores; se copia como `.env` y se completa.

- **`.env` (raíz, la app):** configuración web de Firebase, Cloudinary (upload preset sin firma) y `EXPO_PUBLIC_API_URL`, la dirección del backend de pagos (en Expo Go, `http://IP-DEL-PC:3000`). Ninguno es secreto.
- **`backend/.env`:** ruta de la llave de la cuenta de servicio de Firebase y `MP_ACCESS_TOKEN` de Mercado Pago. **Son secretos**: solo viven en el PC. Ver [backend/README.md](backend/README.md).

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
- **Desconexión:** al cerrar sesión desde el menú, primero se marca No disponible y después se cierra la sesión. Si la app se cierra de golpe estando Disponible, el documento puede quedar con `isAvailable: true`; por eso una ubicación con `updatedAt` de más de 30 s se considera desconectada.
- **Segundo plano:** con la app minimizada, iOS pausa los temporizadores de JavaScript y el envío se detiene hasta volver a abrirla. Enviar en segundo plano exige tareas en segundo plano y permiso "Siempre", que quedan fuera de Expo Go.
- **Último estado del interruptor:** se guarda en AsyncStorage (`@uberclone_conductor:isAvailable:<uid>`), porque es una preferencia y no un dato sensible.

## Cobro (Mercado Pago y efectivo)

- **Pantalla Cobro y resumen:** al finalizar el viaje muestra tarifa, comisión (20 %), ganancia y estado del pago (Pendiente, Aprobado, Rechazado o Efectivo). Escucha el viaje en tiempo real: cambia sola cuando se cobra.
- **Efectivo:** "Recibí el efectivo" marca el viaje `paid` con `paymentStatus: "cash"`. Las reglas de Firestore solo lo permiten al conductor del viaje, si el viaje es en efectivo y está `completed`.
- **Mercado Pago (Checkout Pro, modo de prueba):** la app nunca habla con Mercado Pago. Le pide al backend (`backend/`, `npm start`) que cree el cobro, con el monto guardado en Firestore. El checkout se abre dentro de la app con `expo-web-browser`, y al cerrarlo el backend verifica el pago (monto y moneda) y marca el viaje como pagado. Un viaje de Mercado Pago no se puede marcar pagado desde la app.
- **Sin webhook:** el backend vive en la red local del PC, sin URL pública; el pago se verifica al volver del checkout, y también con el botón "Verificar pago".
- **Salir sin cobrar:** se permite con un aviso; el viaje queda `completed` (por cobrar).
- **Limitación conocida:** en desarrollo, la app llama al backend por `http` en la red local. En un APK de Android el tráfico `http` está bloqueado, y en producción el token de sesión debe viajar por `https`.

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
- [ ] Historial y resumen de ganancias

## Uso de IA

El uso de herramientas de inteligencia artificial está documentado en la bitácora [docs/AI_LOG.md](docs/AI_LOG.md).
