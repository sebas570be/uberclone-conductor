# backend

Proyecto Node aparte de la app (tiene su propio `package.json`). Usa `firebase-admin`, que con la llave de la cuenta de servicio se salta las reglas de Firestore: por eso **nunca** va dentro de la app y la llave solo vive en este PC.

- **Ahora:** simula la app del pasajero (que no existe en este proyecto) creando solicitudes de viaje.
- **Más adelante:** crea la preferencia de pago de Mercado Pago y recibe el webhook.

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

1. Busca un conductor en `driverLocations` con `isAvailable == true` y ubicación de hace menos de 30 s; revisa en `drivers` que esté `approved` y que no tenga otro viaje activo.
2. Elige un origen a 200–1000 m del conductor y un destino a 2–6 km del origen.
3. Pide **una sola vez** la ruta en carro a **OSRM** (distancia en km con 1 decimal, duración redondeada hacia arriba, polyline para dibujarla).
4. Convierte las coordenadas en direcciones con **Nominatim** (máximo 1 consulta por segundo; si falla, se usan las coordenadas).
5. Crea `trips/{id}` con `status: "requested"`.

La tarifa no se guarda aquí: la app la calcula con `calculateFare` (la misma función al estimar y al cobrar).

### Por qué OSRM y no Google

El enunciado sugiere Directions/Distance Matrix, pero son APIs *Legacy* de Google y no se pueden habilitar en proyectos nuevos; su reemplazo (Routes API) exige cuenta de facturación. El mismo enunciado permite OSRM/OpenRouteService y Nominatim (§7): son gratuitos y no necesitan llave.

## Atribución

Rutas: [OSRM](https://project-osrm.org/). Direcciones: [Nominatim](https://nominatim.org/). Datos de mapas © [colaboradores de OpenStreetMap](https://www.openstreetmap.org/copyright).
