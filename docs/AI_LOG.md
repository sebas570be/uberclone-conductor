# Bitácora de uso de IA — UberClone Versión Conductor

Proyecto individual. Toda ayuda de herramientas de IA se registra aquí en el momento de usarla.
Los bloques de código asistidos se marcan con `// AI-assisted: see docs/AI_LOG.md #N`.
Regla: nunca se pegan en un prompt llaves de API, access_token ni datos personales reales.

---

### Entrada #1
- Fecha: 2026-10-28
- Integrante: Fray
- Herramienta: Claude
- Objetivo: Analizar el enunciado del proyecto y armar la lista completa de requisitos y entregables
- Prompt: "Vamos a resolver, pero primero leelo todo y haz un cheklist completo de todo lo que se debe entregar y no cometer el error del proyecto expo pokedex"
- Resumen de la respuesta: Checklist con un código por requisito (registro, pantallas, estados del viaje, hooks, pagos, tarifa, historial, APIs, bitácora y entregables). Señaló riesgos: Directions y Distance Matrix son legacy en proyectos nuevos de Google (se usará Routes API), las notificaciones push no funcionan en Expo Go desde SDK 53 y Cloud Functions exige plan Blaze.
- Qué se usó / modificó / descartó: Se usó el checklist como guía del proyecto. Se ajustó la meta de commits a ~32 (indicación de la docente) y se decidió trabajar en iPhone con Expo Go, dejando push y APK para un emulador Android.
- Archivos y commit: Ninguno (planeación previa al código).
- Verificación: Cada punto del checklist se contrastó con el PDF del enunciado y con la concertación de evaluación. Los riesgos se verificaron en la documentación oficial de Google Maps Platform (Legacy products) y de Expo (Push notifications FAQ).
- Aprendizaje: Leer todo el enunciado y listar cada requisito con un código antes de programar evita olvidar reglas que aplican a todos los archivos.

### Entrada #2
- Fecha: 2026-11-01
- Integrante: Fray
- Herramienta: Claude
- Objetivo: Definir la estructura de carpetas del proyecto con una responsabilidad clara para cada una
- Prompt: "el primer commit debe ser el orden de las carpetas es decir darle sentido a la arquitectura"
- Resumen de la respuesta: Propuso una arquitectura por capas (screens/components → hooks/context → services → exterior), con carpetas config, navigation, screens, components, context, hooks, services, utils, constants e i18n, más backend/ y docs/. Generó docs/ARCHITECTURE.md y un README.md por carpeta.
- Qué se usó / modificó / descartó: Se usó la estructura completa. Se eliminaron AGENTS.md y .claude/ de la plantilla de Expo porque indican usar Expo Router y el proyecto usa React Navigation (Stack + Tabs + Drawer).
- Archivos y commit: src/*/README.md, backend/README.md, docs/ARCHITECTURE.md, docs/capturas/README.md — c9aba43
- Verificación: El proyecto abre en Expo Go (SDK 58) en el iPhone; `git status` limpio después del commit. Se confirmó que Git no versiona carpetas vacías, por eso cada carpeta lleva su README.md.
- Aprendizaje: Separar quién dibuja, quién maneja el estado y quién habla con el exterior permite cambiar un proveedor (Firebase, pasarela de pago) tocando una sola carpeta.
