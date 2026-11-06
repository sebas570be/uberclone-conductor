# Bitácora de uso de IA — UberClone Versión Conductor

Proyecto individual. Se registra el uso de herramientas de IA en el momento de usarlas.
Los bloques de código asistidos se marcan con `// AI-assisted: see docs/AI_LOG.md #N`.
Regla: nunca se pegan en un prompt llaves de API, access_token ni datos personales reales.

---



### Entrada #1
- Fecha: 2026-11-04
- Integrante: Fray Sebastián Benítez Rodríguez
- Herramienta: Gemini
- Objetivo: Realizar un code review de la función `calculateFare` y sus validaciones para un proyecto de UberClone versión conductor en React Native.
- Prompt: "Estoy haciendo solo un proyecto para la materia Desarrollo Móvil: UberClone versión conductor. Stack: Expo SDK 58, React Native 0.88, JavaScript (sin TypeScript), pruebo con Expo Go en iPhone. No me sugieras instalar librerías nuevas.

  Tengo una función pura calculateFare en src/utils/calculateFare.js que calcula la tarifa, la comisión del 20 % y la ganancia del conductor. Los valores vienen de src/config/pricing.js. Con el ejemplo del enunciado (8,5 km y 22 min) da bien: Económico 19.200 / 3.840 / 15.360 y XL 26.900 / 5.380 / 21.520.

  Revisándola encontré un error en la validación. Antes estaba así:

  if (!(distanceKm >= 0) || !(durationMin >= 0) || !(tip >= 0)) { throw ... }

  Si llega distanceKm = '5' (texto), pasa la validación porque '5' >= 0 da true. Y si la propina llega como '1000', la ganancia queda "153601000" porque el + pega el texto en vez de sumar. Tampoco atrapa Infinity.

  Esta es la propuesta de cambio:

  ```js
  const isValidAmount = (value) =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0;

  export function calculateFare({ distanceKm, durationMin, category, tip = 0 }) {
    const multiplier = PRICING.categoryMultipliers[category];
    if (multiplier === undefined) {
      throw new Error(`Categoría desconocida: ${category}`);
    }
    if (!isValidAmount(distanceKm) || !isValidAmount(durationMin) || !isValidAmount(tip)) {
      throw new Error('Distancia, duración y propina deben ser números mayores o iguales a 0');
    }
    const rawFare =
      (PRICING.baseFare + distanceKm * PRICING.pricePerKm + durationMin * PRICING.pricePerMinute) *
      multiplier;
    const fareWithMinimum = Math.max(PRICING.minimumFare, rawFare);
    const fare = Math.round(fareWithMinimum / PRICING.roundingStep) * PRICING.roundingStep;
    const commission = Math.round(fare * PRICING.commissionRate);
    const driverEarnings = fare - commission + tip;
    return { fare, commission, tip, driverEarnings, commissionRate: PRICING.commissionRate };
  }
  ```

  Hazme un par review. Mis dudas:
  1. ¿Es mejor lanzar un error cuando el dato es inválido, o convertirlo con Number('5') para que siga funcionando? Pienso que convertir escondería un error de la API de rutas, pero no estoy seguro.
  2. ¿Dejo isValidAmount dentro de este archivo o la paso a utils/validators.js? Por ahora solo la usa calculateFare.
  3. ¿Se me escapa algún caso que todavía pase la validación?"
- Resumen de la respuesta: Se validó favorablemente el uso de errores explícitos (fail fast) en lugar de conversiones automáticas, se recomendó mantener la función auxiliar local aplicando el principio YAGNI, y se discutió el manejo de valores numéricos en cero versus la lógica de negocio en la capa de servicios.
- Qué se usó / modificó / descartó: Se adoptó la estrategia de lanzar excepciones ante datos no numéricos y mantener `isValidAmount` de forma local en el archivo de utilidades, descartando por decisión de diseño del usuario agregar validaciones estrictas mayores a cero en esta capa pura para permitir tarifas mínimas y redondeos de duración.
- Archivos y commit: src/utils/calculateFare.js, src/config/pricing.js — ab1b000
- Verificación: Pruebas unitarias con Jest (jest-expo) en src/utils/__tests__/calculateFare.test.js — commit 9140383. `npm test`: 4 passed de 4. Comprueban el ejemplo del enunciado (8,5 km y 22 min: Económico 19.200 / 3.840 / 15.360 y XL 26.900 / 5.380 / 21.520) y que la función rechaza una distancia en texto ('5') y una propina en texto ('1000').
- Aprendizaje: Mantener las funciones de cálculo puras y estrictas en cuanto a tipos de datos previene errores silenciosos de concatenación, delegando las reglas de negocio de flujos operativos hacia las capas superiores correspondientes.

### Entrada #2
- Fecha: 2026-11-04
- Integrante: Fray Sebastián Benítez Rodríguez
- Herramienta: Claude
- Objetivo: Obtener un análisis detallado del enunciado del proyecto (requisitos, flujo, módulos, modelo de datos, criterios de evaluación, dificultades e inconsistencias) antes de continuar con el desarrollo.
- Prompt: "Yo quiero antes de seguir, poner en el uso de IA toda la evaluacion del proyecto, como lo hace notebook lm no se si me hago entender" — "Lo que quiero es que yo le cargue el proyecto y el me haga una analicis y un plan de trabajo" — "o damelo tu, da lo mismo, pasamelo tu y lo pones en la bitacora" — "pero quiero un analisis primero del trabajo no de como voy" — "mas detalle y ya dame la bitacora para ponerlo como bitacora #2"
- Resumen de la respuesta: Análisis del enunciado en 16 secciones: flujo completo y estados del viaje, los 22 campos del registro con sus reglas de validación, pantallas, hooks obligatorios, flujo de pago con backend, fórmula de tarifa, historial y modelo de datos, APIs con sus equivalentes en Expo Go, criterios de evaluación de la concertación, dificultades técnicas y 13 vacíos o inconsistencias del enunciado con una resolución propuesta.
- Qué se usó / modificó / descartó: Se usó el análisis completo como guía de estudio y de desarrollo; se guardó fuera del repositorio porque es material de estudio personal. Se pidió una primera versión que se descartó por hablar del avance del proyecto y no del enunciado, y se pidió más detalle en la segunda. Se descartó usar NotebookLM para este análisis. El plan de trabajo quedó para una sesión posterior, después del análisis.
- Archivos y commit: Ninguno (análisis previo, sin cambios en el repositorio)
- Verificación: Cada sección se contrastó con el enunciado (§1–§9), la concertación de evaluación del grupo 003, el microcurrículo y el instructivo de la bitácora.
- Aprendizaje: Analizar el enunciado completo antes de programar permite ver cómo se conectan los módulos (registro, solicitudes, viaje, pago e historial), identificar las partes más difíciles y detectar a tiempo requisitos que no funcionan en Expo Go o que dependen de APIs que Google ya no habilita.

### Entrada #3
- Fecha: 2026-11-05
- Integrante: Fray Sebastián Benítez Rodríguez
- Herramienta: Gemini
- Objetivo: Definir y revisar cómo se anidan los navegadores (Stack, Tabs y Drawer) según el estado del conductor, cómo probarlos antes de tener Firebase, y revisar el código del esqueleto ya probado.
- Prompt 1: "Sigo con mi proyecto UberClone versión conductor (Expo SDK 58, JavaScript, Expo Go en iPhone, React Navigation 7 ya instalado: native-stack, bottom-tabs y drawer).

  El enunciado pide navegación combinada: Stack para el flujo del viaje, Tabs para el registro (3 pestañas: Datos personales, Vehículo, Documentos) y Drawer para perfil, historial, ganancias y configuración. No dice cómo se anidan. Además, el conductor solo puede usar la app cuando su registro está "approved"; antes está "pending".

  Esta es la estructura que me suena no se si este correcta:

  RootNavigator (decide según la sesión y el estado del conductor)
  sin sesión -> AuthStack (Login)
  sin registro -> RegisterTabs (3 pestañas)
  pending -> PendingScreen
  approved -> MainDrawer: Inicio (con un TripStack: Inicio -> Solicitud -> Viaje en curso -> Cobro), Historial, Ganancias, Perfil

  Mis dudas:
  ¿Esta anidación es correcta o conviene otra? ¿El TripStack debe ir dentro del Drawer o por encima de él?
  2. ¿Hago ahora el esqueleto completo con pantallas simples (solo el nombre) o agrego cada navegador cuando construya su pantalla?
  3. Firebase todavía no está. Pienso usar un SessionContext con el estado simulado ('approved', 'pending', etc.) que cambio a mano para probar, y después lo conecto a Firebase. ¿Es buena idea o hay una forma mejor?

  Hazme un par review de la propuesta."
- Prompt 2: "si, planteame el codigo yo lo veo y reviso que usar y que no segun mi concepto"
- Prompt 3: "
Ya monté el esqueleto de navegación que revisamos y lo probé en mi iPhone con Expo Go: los 4 estados funcionan (approved, pending, unregistered, signedOut) y en la pantalla "Solicitud" el menú del Drawer no se abre. Uso Expo SDK 58, JavaScript, React Navigation 7 (native-stack 7.21, bottom-tabs 7.21, drawer 7.14), react-native-gesture-handler 3.3 y react-native-reanimated 4.7.
  
  Te paso el código de los 8 archivos para que me hagas un par review de si es viable y correcto.
  
  ```js
  ===== App.js =====
  // App.js
  // Jerarquía (de afuera hacia adentro):
  // GestureHandlerRootView → SafeAreaProvider → SessionProvider → NavigationContainer → RootNavigator.
  // - GestureHandlerRootView: necesario para los gestos (deslizar el Drawer).
  // - SessionProvider va por encima de la navegación para que RootNavigator y
  //   cualquier pantalla puedan leer el estado del conductor.
  // AI-assisted: see docs/AI_LOG.md #3
  import React from 'react';
  import { StyleSheet } from 'react-native';
  import { StatusBar } from 'expo-status-bar';
  import { GestureHandlerRootView } from 'react-native-gesture-handler';
  import { SafeAreaProvider } from 'react-native-safe-area-context';
  import { NavigationContainer } from '@react-navigation/native';
  import { SessionProvider } from './src/context/SessionContext';
  import RootNavigator from './src/navigation/RootNavigator';
  
  export default function App() {
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <SessionProvider>
            <NavigationContainer>
              <StatusBar style="dark" />
              <RootNavigator />
            </NavigationContainer>
          </SessionProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }
  
  const styles = StyleSheet.create({
    root: {
      flex: 1,
    },
  });
  
  ===== src/context/SessionContext.js =====
  // src/context/SessionContext.js
  // Context de sesión: guarda en qué situación está el conductor para que la
  // navegación raíz (RootNavigator) decida qué pantallas mostrar.
  // Por ahora el estado es SIMULADO: se cambia a mano INITIAL_STATUS para probar
  // cada caso. Cuando llegue Firebase, este archivo leerá el estado real
  // (sesión + documento del conductor) y los navegadores no cambian.
  // AI-assisted: see docs/AI_LOG.md #3
  import React, { createContext, useMemo, useState } from 'react';
  
  // Estados posibles del conductor, en el orden en que avanza.
  export const DRIVER_STATUS = Object.freeze({
    SIGNED_OUT: 'signedOut', // sin sesión
    UNREGISTERED: 'unregistered', // tiene cuenta, pero no ha enviado el registro
    PENDING: 'pending', // registro enviado, esperando aprobación
    APPROVED: 'approved', // aprobado: puede usar la app
  });
  
  // Valor para probar: cámbialo, guarda y la app muestra otra rama del árbol.
  const INITIAL_STATUS = DRIVER_STATUS.APPROVED;
  
  export const SessionContext = createContext(null);
  
  export function SessionProvider({ children }) {
    const [driverStatus, setDriverStatus] = useState(INITIAL_STATUS);
  
    // useMemo: el objeto solo se crea de nuevo cuando cambia el estado, así las
    // pantallas que usan el contexto no se vuelven a dibujar sin necesidad.
    const value = useMemo(() => ({ driverStatus, setDriverStatus }), [driverStatus]);
  
    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
  }
  
  ===== src/hooks/useSession.js =====
  // src/hooks/useSession.js
  // Hook para leer el SessionContext. Si se usa fuera del SessionProvider avisa
  // con un error claro, en vez de fallar después con datos vacíos.
  // AI-assisted: see docs/AI_LOG.md #3
  import { useContext } from 'react';
  import { SessionContext } from '../context/SessionContext';
  
  export default function useSession() {
    const context = useContext(SessionContext);
    if (!context) {
      throw new Error('useSession debe usarse dentro de un <SessionProvider>.');
    }
    return context;
  }
  
  ===== src/components/PlaceholderScreen.js =====
  // src/components/PlaceholderScreen.js
  // Pantalla provisional del esqueleto de navegación: muestra el nombre de la
  // ruta y, si la ruta trae el parámetro "next", un botón para ir a la siguiente.
  // Cada una se reemplaza por la pantalla real cuando se construya su módulo.
  // AI-assisted: see docs/AI_LOG.md #3
  import React from 'react';
  import { View, Text, Pressable, StyleSheet } from 'react-native';
  
  export default function PlaceholderScreen({ route, navigation }) {
    const next = route.params?.next;
  
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{route.name}</Text>
        <Text style={styles.subtitle}>Pantalla en construcción</Text>
        {next && (
          <Pressable
            style={styles.button}
            onPress={() => navigation.navigate(next)}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Ir a {next}</Text>
          </Pressable>
        )}
      </View>
    );
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      backgroundColor: '#FFFFFF',
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: '#111827',
    },
    subtitle: {
      marginTop: 4,
      fontSize: 14,
      color: '#6B7280',
    },
    button: {
      marginTop: 24,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      backgroundColor: '#111827',
    },
    buttonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });
  
  ===== src/navigation/RegisterTabs.js =====
  // src/navigation/RegisterTabs.js
  // Tabs del registro (enunciado §2): las 3 pestañas del formulario del conductor.
  // AI-assisted: see docs/AI_LOG.md #3
  import React from 'react';
  import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
  import PlaceholderScreen from '../components/PlaceholderScreen';
  
  const Tab = createBottomTabNavigator();
  
  export default function RegisterTabs() {
    return (
      <Tab.Navigator>
        <Tab.Screen name="PersonalData" component={PlaceholderScreen} options={{ title: 'Datos personales' }} />
        <Tab.Screen name="Vehicle" component={PlaceholderScreen} options={{ title: 'Vehículo' }} />
        <Tab.Screen name="Documents" component={PlaceholderScreen} options={{ title: 'Documentos' }} />
      </Tab.Navigator>
    );
  }
  
  ===== src/navigation/TripStack.js =====
  // src/navigation/TripStack.js
  // Stack del viaje (enunciado §3): Inicio → Solicitud → Viaje en curso → Cobro.
  // Cada pantalla provisional recibe en "next" la siguiente, para probar el flujo.
  // AI-assisted: see docs/AI_LOG.md #3
  import React from 'react';
  import { createNativeStackNavigator } from '@react-navigation/native-stack';
  import PlaceholderScreen from '../components/PlaceholderScreen';
  
  const Stack = createNativeStackNavigator();
  
  export default function TripStack() {
    return (
      <Stack.Navigator>
        {/* Home sin encabezado propio: usa el del Drawer (con el botón de menú) */}
        <Stack.Screen
          name="Home"
          component={PlaceholderScreen}
          options={{ headerShown: false }}
          initialParams={{ next: 'TripRequest' }}
        />
        <Stack.Screen
          name="TripRequest"
          component={PlaceholderScreen}
          options={{ title: 'Solicitud' }}
          initialParams={{ next: 'TripInProgress' }}
        />
        <Stack.Screen
          name="TripInProgress"
          component={PlaceholderScreen}
          options={{ title: 'Viaje en curso' }}
          initialParams={{ next: 'TripSummary' }}
        />
        <Stack.Screen name="TripSummary" component={PlaceholderScreen} options={{ title: 'Cobro y resumen' }} />
      </Stack.Navigator>
    );
  }
  
  ===== src/navigation/MainDrawer.js =====
  // src/navigation/MainDrawer.js
  // Drawer del conductor aprobado (enunciado F8): Inicio (con el TripStack),
  // Historial, Ganancias y Perfil.
  // AI-assisted: see docs/AI_LOG.md #3
  import React from 'react';
  import { createDrawerNavigator } from '@react-navigation/drawer';
  import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
  import TripStack from './TripStack';
  import PlaceholderScreen from '../components/PlaceholderScreen';
  
  const Drawer = createDrawerNavigator();
  
  // Estar dentro del Drawer NO oculta el menú por sí solo: hay que bloquearlo.
  // Mientras el conductor está en una pantalla del viaje (cualquiera distinta de
  // Home) se quita el encabezado del Drawer y el gesto para abrir el menú.
  function startOptions({ route }) {
    const focusedScreen = getFocusedRouteNameFromRoute(route) ?? 'Home';
    const isHome = focusedScreen === 'Home';
    return { title: 'Inicio', headerShown: isHome, swipeEnabled: isHome };
  }
  
  export default function MainDrawer() {
    return (
      <Drawer.Navigator>
        <Drawer.Screen name="Start" component={TripStack} options={startOptions} />
        <Drawer.Screen name="History" component={PlaceholderScreen} options={{ title: 'Historial' }} />
        <Drawer.Screen name="Earnings" component={PlaceholderScreen} options={{ title: 'Ganancias' }} />
        <Drawer.Screen name="Profile" component={PlaceholderScreen} options={{ title: 'Perfil y configuración' }} />
      </Drawer.Navigator>
    );
  }
  
  ===== src/navigation/RootNavigator.js =====
  // src/navigation/RootNavigator.js
  // Navegación raíz: según el estado del conductor (SessionContext) solo existe
  // una de las ramas. Un conductor que no está "approved" nunca tiene el Drawer
  // montado, así que no puede llegar a Inicio ni ponerse disponible (enunciado §2).
  // AI-assisted: see docs/AI_LOG.md #3
  import React from 'react';
  import { createNativeStackNavigator } from '@react-navigation/native-stack';
  import useSession from '../hooks/useSession';
  import { DRIVER_STATUS } from '../context/SessionContext';
  import RegisterTabs from './RegisterTabs';
  import MainDrawer from './MainDrawer';
  import PlaceholderScreen from '../components/PlaceholderScreen';
  
  const Stack = createNativeStackNavigator();
  
  export default function RootNavigator() {
    const { driverStatus } = useSession();
  
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {driverStatus === DRIVER_STATUS.SIGNED_OUT && (
          <Stack.Screen
            name="Login"
            component={PlaceholderScreen}
            options={{ headerShown: true, title: 'Iniciar sesión' }}
          />
        )}
        {driverStatus === DRIVER_STATUS.UNREGISTERED && (
          <Stack.Screen name="Register" component={RegisterTabs} />
        )}
        {driverStatus === DRIVER_STATUS.PENDING && (
          <Stack.Screen
            name="Pending"
            component={PlaceholderScreen}
            options={{ headerShown: true, title: 'Pendiente de aprobación' }}
          />
        )}
        {driverStatus === DRIVER_STATUS.APPROVED && <Stack.Screen name="Main" component={MainDrawer} />}
      </Stack.Navigator>
    );
  }
  ```
  
  Mis dudas:
  1. ¿Es correcto renderizar las pantallas del RootNavigator de forma condicional según driverStatus, o es mejor navegar con navigation.navigate/reset cuando cambia el estado?
  2. Para bloquear el menú durante el viaje uso getFocusedRouteNameFromRoute en las options del Drawer (headerShown y swipeEnabled solo en Home). ¿Es la forma recomendada en React Navigation 7 o hay una mejor?
  3. En la pantalla "Solicitud", al deslizar a la derecha se regresa a Inicio (gesto de volver del Stack en iOS). En el viaje real eso no debería pasar. ¿Lo quito con gestureEnabled: false y headerBackVisible: false en las pantallas del viaje, o hay otra forma?
  4. ¿Está bien el orden de los providers en App.js (GestureHandlerRootView, SafeAreaProvider, SessionProvider, NavigationContainer)?
  5. ¿Ves algo que vaya a dar problemas cuando conecte Firebase al SessionContext?
  
  No me sugieras instalar librerías nuevas.
  "
- Resumen de la respuesta: En la primera revisión Gemini aprobó la estructura (TripStack dentro del Drawer), recomendó el esqueleto completo y el SessionContext con estado simulado, y sugirió un botón flotante para cambiar de estado; a la segunda pregunta respondió sobre una "pantalla de perfil" ajena al proyecto. En la revisión del código confirmó el renderizado condicional en la raíz y `getFocusedRouteNameFromRoute`, recomendó `gestureEnabled: false` y `headerBackVisible: false` en las pantallas del viaje, y advirtió que al conectar Firebase hace falta un estado de carga y limpiar los listeners.
- Qué se usó / modificó / descartó: Se usó la estructura del árbol, el esqueleto completo y el SessionContext con estado simulado, cambiado a mano. Se modificó la afirmación de que el Drawer queda oculto durante el viaje: no ocurre solo, así que se bloqueó con `swipeEnabled` y `headerShown` según la pantalla activa. En vez de 12 archivos de pantalla vacíos se usó un solo `PlaceholderScreen`. Se descartó el botón flotante y la respuesta sobre la "pantalla de perfil". Quedan pendientes: bloquear el regreso en las pantallas del viaje en la rama del viaje (Gemini no mencionó que `gestureEnabled` no bloquea el botón atrás de Android; para eso se usará `usePreventRemove`) y el estado de carga con `unsubscribe` al conectar Firebase.
- Archivos y commit: src/context/SessionContext.js, src/hooks/useSession.js — bcf342e · src/components/PlaceholderScreen.js, src/navigation/RegisterTabs.js, src/navigation/TripStack.js, src/navigation/MainDrawer.js — a639984 · src/navigation/RootNavigator.js, App.js, docs/capturas/04 a 11 — d3f28cf
- Verificación: Prueba en iPhone con Expo Go de los 4 estados (approved, pending, unregistered, signedOut) cambiando INITIAL_STATUS: cada estado muestra solo su rama y en "Solicitud" el menú no se puede abrir (capturas 04 a 11). `npm test`: 4 passed. Revisión del código con Gemini.
- Aprendizaje: El enunciado dice qué navegador usar, pero no cómo anidarlos; decidir la raíz por el estado del conductor hace que un conductor no aprobado ni siquiera tenga montado el menú. Aprendí a no aceptar todo lo que dice la IA: el Drawer no se bloquea solo, una respuesta de Gemini era de otra conversación y su revisión no consideró el botón atrás de Android. De aquí en adelante le pido revisiones críticas, no aprobación.

### Entrada #4
- Fecha: 2026-11-06
- Integrante: Fray Sebastián Benítez Rodríguez
- Herramienta: Claude
- Objetivo: Configurar Firebase paso a paso para el proyecto: crear el proyecto en la consola, registrar la app web, guardar la configuración en variables de entorno, activar Authentication y crear Firestore, e instalar el SDK de Firebase.
- Prompt: "entonces vamos a paso paso con el firebase" — "este paso no lo entiendo" (sobre la instrucción de crear el archivo .env) — "y que nombre le pong al .env ?" — "[configuración web de Firebase pegada desde la consola; valores omitidos] dame el que debo poner entonces en el visaul" — "listo guardado" — "entonces de aqui que ?" — "confirmada la ubicaicon que dices" — "Listo acabo de crear la rama y abajo te epgo la salida del install firebase"
- Resumen de la respuesta: Guía paso a paso para crear el proyecto `uberclone-conductor` en el plan Spark, registrar la app web, pasar los 6 valores del `firebaseConfig` a un archivo `.env` con variables `EXPO_PUBLIC_FIREBASE_*`, activar el acceso con correo y contraseña, crear Firestore en `southamerica-east1` en modo de producción e instalar el SDK con `npx expo install firebase`.
- Qué se usó / modificó / descartó: Se usaron todos los pasos. Se modificó el `.env`: la primera vez se copiaron los valores de ejemplo en lugar de los reales y se corrigió con la configuración del proyecto. Se descartó el comando `npm install firebase` que muestra la consola (se usó `npx expo install`), Google Analytics, Gemini en Firebase, "Acceder con Google", la autenticación de varios factores, el plan Blaze y el modo de prueba de Firestore (se eligió modo de producción para que la base no quede abierta).
- Archivos y commit: package.json, package-lock.json (firebase 13.2.0) — [completar con el hash del commit 1 de feature/firebase]. El archivo .env no se sube al repositorio (está en el .gitignore).
- Verificación: Revisión del .env en el PC: las 6 variables con el nombre exacto y los valores del proyecto, sin valores de ejemplo. `git status` limpio, lo que confirma que el .env está ignorado. En la consola: Correo electrónico/contraseña "Habilitada" y reglas de Firestore `allow read, write: if false;`. En la instalación, Expo mostró `env: load .env` con las 6 variables cargadas.
- Aprendizaje: La configuración web de Firebase no es secreta (la seguridad la dan las reglas de Firestore), pero igual se guarda en un .env para no dejarla fija en el código; Expo solo expone a la app las variables con prefijo `EXPO_PUBLIC_`. Elegir modo de producción en Firestore obliga a escribir reglas antes de usar la base, pero evita dejar los datos abiertos.