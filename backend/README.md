# backend

Proyecto Node aparte de la app (tiene su propio `package.json`). Usa `firebase-admin`, que con la llave de la cuenta de servicio se salta las reglas de Firestore: por eso **nunca** va dentro de la app y la llave solo vive en este PC.

- Simula la app del pasajero (que no existe en este proyecto) creando solicitudes de viaje.
- Es el servidor de pagos: crea el cobro en Mercado Pago y verifica si el pasajero pagó.

## Instalación

```bash
cd backend
npm install
```

1. Firebase → Configuración del proyecto → Cuentas de servicio → **Generar nueva clave privada**.
2. Guarda el archivo como `backend/serviceAccountKey.json` (está en `.gitignore`; nunca se sube ni se comparte).
3. Copia `.env.example` como `.env` (también excluido de Git).

## Simular una solicitud de viaje

Con la app abierta en una cuenta **aprobada** y el switch en **Disponible**:

```bash
npm run solicitud                  # método de pago al azar
npm run solicitud -- cash          # fuerza efectivo
npm run solicitud -- mercadopago   # fuerza Mercado Pago
```

El script:

1. Busca un conductor en `driverLocations` con `isAvailable == true` y ubicación de hace menos de 5 min (la app puede estar en segundo plano); revisa en `drivers` que esté `approved` y que no tenga otro viaje activo.
2. Elige un origen a 200–1000 m del conductor y un destino a 2–6 km del origen.
3. Pide **una sola vez** la ruta en carro a **OSRM** (distancia en km con 1 decimal, duración redondeada hacia arriba, polyline para dibujarla).
4. Convierte las coordenadas en direcciones con **Nominatim** (máximo 1 consulta por segundo; si falla, se usan las coordenadas).
5. Crea `trips/{id}` con `status: "requested"`.
6. Envía una **notificación push** (Firebase Cloud Messaging) al token del conductor en `pushTokens/{uid}`, en su idioma, con prioridad alta y vencimiento de 20 s. Solo existe token en la APK de Android (Expo Go no recibe push). Si el token ya no sirve, se borra.

La tarifa no se guarda aquí: la app la calcula con `calculateFare` (la misma función al estimar y al cobrar).

### Por qué OSRM y no Google

El enunciado sugiere Directions/Distance Matrix, pero son APIs *Legacy* de Google y no se pueden habilitar en proyectos nuevos; su reemplazo (Routes API) exige cuenta de facturación. El mismo enunciado permite OSRM/OpenRouteService y Nominatim (§7): son gratuitos y no necesitan llave.

## Servidor de pagos (Mercado Pago)

El Access Token de Mercado Pago es secreto: por eso el cobro se crea aquí y no en la app.

### Configuración

1. En [Mercado Pago Developers](https://www.mercadopago.com.co/developers) → **Cuentas de prueba**, crea una cuenta **vendedor** y una **comprador**.
2. Entra (en incógnito) con la cuenta **vendedor de prueba**, crea una aplicación **Checkout Pro** y copia **Credenciales de producción → Access Token** (empieza por `APP_USR-`).
3. Ponlo en `backend/.env` como `MP_ACCESS_TOKEN=...` junto con `PORT=3000`.

Como es la cuenta de prueba, no se mueve dinero real. El pago se hace con la cuenta **comprador de prueba** y las tarjetas de prueba (panel de la aplicación → **Tarjetas de prueba**; CVV `123`) (titular `APRO` = aprobado, `OTHE` = rechazado, `CONT` = pendiente).

### Ejecutar

```bash
npm start   # servidor en el puerto 3000, escucha en toda la red local
npm test    # pruebas de las funciones de pago y del mensaje push (node --test)
```

Desde el iPhone (mismo Wi-Fi) abre `http://IP-DEL-PC:3000/health`: debe responder `{"ok":true}`.

### Rutas

Las dos exigen `Authorization: Bearer <idToken de Firebase>` y solo atienden al conductor dueño del viaje.

| Ruta | Body | Respuesta |
| --- | --- | --- |
| `POST /api/payments/start` | `{ tripId }` | `{ checkoutUrl }` |
| `POST /api/payments/verify` | `{ tripId }` | `{ paymentStatus }` |

- **start:** el viaje debe estar `completed` y ser por Mercado Pago. El monto sale del viaje guardado en Firestore, nunca de la app. `external_reference` = id del viaje.
- **verify:** busca los pagos del viaje en Mercado Pago. Si hay uno aprobado por el monto y la moneda correctos, el viaje pasa a `paid`. La escritura se hace en una transacción que solo actúa si el viaje sigue en `completed`.

### Por qué se verifica al volver y no con webhook

El webhook necesita una URL pública en internet; este servidor solo vive en la red local del PC. Por eso el pago se confirma cuando la app vuelve del checkout y llama a `verify`, que le pregunta a Mercado Pago.

### API de Preferences

Mercado Pago avisa que la API de Preferences "será descontinuada pronto" y recomienda la API de Orders. Se usa Preferences porque sigue funcionando y es la que describe el enunciado (Checkout Pro). El cambio quedaría en `src/services/mercadoPagoService.js`.

## Atribución

Rutas: [OSRM](https://project-osrm.org/). Direcciones: [Nominatim](https://nominatim.org/). Datos de mapas © [colaboradores de OpenStreetMap](https://www.openstreetmap.org/copyright).
