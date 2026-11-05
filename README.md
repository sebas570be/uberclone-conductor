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

## Estado del desarrollo

- [x] Arquitectura por capas
- [x] Cálculo de tarifa, comisión y ganancia neta (`src/utils/calculateFare.js`) con pruebas
- [ ] Registro del conductor (datos personales, vehículo y documentos)
- [ ] Disponibilidad y ubicación en tiempo real
- [ ] Solicitudes con tiempo límite
- [ ] Navegación al punto de recogida y al destino
- [ ] Cobro con Mercado Pago y en efectivo
- [ ] Historial y resumen de ganancias

## Uso de IA

El uso de herramientas de inteligencia artificial está documentado en la bitácora [docs/AI_LOG.md](docs/AI_LOG.md).
