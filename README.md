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

Las llaves secretas (Mercado Pago, Google) **no se suben al repositorio**: van en archivos `.env`, que están en el `.gitignore`. El archivo `.env.example` con los nombres de las variables (sin valores) se agrega cuando se configuren los servicios externos.

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

## Estado del desarrollo

- [x] Arquitectura por capas
- [x] Cálculo de tarifa, comisión y ganancia neta (`src/utils/calculateFare.js`) con pruebas
- [x] Inicio de sesión y creación de cuenta (Firebase Auth) con sesión en tiempo real según el estado del conductor
- [x] Registro del conductor (datos personales, vehículo, documentos y fotos) guardado en Firestore con estado pendiente
- [x] Reglas de seguridad de Firestore que validan el registro y la ubicación
- [x] Disponibilidad y ubicación en tiempo real
- [ ] Solicitudes con tiempo límite
- [ ] Navegación al punto de recogida y al destino
- [ ] Cobro con Mercado Pago y en efectivo
- [ ] Historial y resumen de ganancias

## Uso de IA

El uso de herramientas de inteligencia artificial está documentado en la bitácora [docs/AI_LOG.md](docs/AI_LOG.md).
