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
- Archivos y commit: package.json, package-lock.json (firebase 13.2.0), src/config/firebase.js, .env.example — 85b63da. El archivo .env no se sube al repositorio (está en el .gitignore)
- Verificación: Revisión del .env en el PC: las 6 variables con el nombre exacto y los valores del proyecto, sin valores de ejemplo. `git status` limpio, lo que confirma que el .env está ignorado. En la consola: Correo electrónico/contraseña "Habilitada" y reglas de Firestore `allow read, write: if false;`. En la instalación, Expo mostró `env: load .env` con las 6 variables cargadas.
- Aprendizaje: La configuración web de Firebase no es secreta (la seguridad la dan las reglas de Firestore), pero igual se guarda en un .env para no dejarla fija en el código; Expo solo expone a la app las variables con prefijo `EXPO_PUBLIC_`. Elegir modo de producción en Firestore obliga a escribir reglas antes de usar la base, pero evita dejar los datos abiertos.

### Entrada #5
- Fecha: 2026-11-06
- Integrante: Fray Sebastián Benítez Rodríguez
- Herramienta: Gemini
- Objetivo: Decidir dónde guardar la sesión de Firebase Authentication (AsyncStorage o SecureStore) para que el conductor no tenga que iniciar sesión cada vez que abre la app.
- Prompt: "Sigo con mi UberClone versión conductor (Expo SDK 58, JavaScript, Expo Go en iPhone, Firebase JS SDK 13.2). Voy a agregar Firebase Authentication con correo y contraseña.

  Tengo que decidir dónde se guarda la sesión del usuario para que no tenga que iniciar sesión cada vez que abre la app:

  (a) La forma que documenta Expo: initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) }), con @react-native-async-storage/async-storage. El token de renovación de Firebase queda en AsyncStorage, que no está cifrado.

  (b) expo-secure-store (cifrado), escribiendo un adaptador propio con getItem/setItem/removeItem para pasárselo a getReactNativePersistence. Las reglas de mi curso dicen que los tokens van en SecureStore. Pero SecureStore no acepta ":" en las claves (Firebase usa claves como "firebase:authUser:...") y avisa con valores de más de 2048 bytes.

  Mis dudas:
  1. ¿Cuál es más correcta para un proyecto académico que se evalúa en seguridad? ¿El riesgo de (a) es real en un celular?
  2. Si elijo (b), ¿qué puede fallar con el adaptador (claves, tamaño, Android vs iOS)?
  3. ¿Hay una opción (c) mejor que no esté viendo?

  No me digas que está bien si no lo está. Busca errores, casos que fallen (Android e iOS) y lo que haría distinto un desarrollador senior. No me sugieras librerías fuera de Expo."
- Resumen de la respuesta: Gemini consideró (b) la más correcta frente a la regla del curso y confirmó que el riesgo de (a) es real en dispositivos con root, jailbreak o respaldos sin cifrar. Advirtió que (b) choca con las claves con ":" y el límite de 2048 bytes de SecureStore, y propuso como alternativa mantener la sesión en memoria o usar (a) con una justificación documentada.
- Qué se usó / modificó / descartó: Se usó la opción (a) con la justificación documentada en el código. Se corrigieron afirmaciones de Gemini: el almacenamiento de AsyncStorage es SQLite en Android y archivos en iOS (no al revés), y el límite de 2048 bytes hoy solo genera una advertencia. Se descartaron `react-native-mmkv` y `NSFileProtectionComplete` (no funcionan en Expo Go) y la sesión en memoria (obliga a iniciar sesión cada vez). Gemini no consideró que (b) se puede resolver dividiendo el valor en pedazos; queda como mejora si se necesita.
- Archivos y commit: src/config/firebase.js (inicialización de auth con persistencia), src/services/authService.js, src/screens/auth/LoginScreen.js, src/utils/validators.js — b66047a
- Verificación: En el iPhone se creó una cuenta, se inició sesión, se probó un correo repetido y una contraseña equivocada (capturas 12 a 16); las cuentas aparecen en la consola de Firebase, Authentication → Usuarios (captura 17). `npm test`: 7 passed.
- Aprendizaje: Guardar la sesión implica decidir entre seguridad y estabilidad: SecureStore cifra, pero Firebase guarda valores que superan su límite. El enunciado permite la sesión en AsyncStorage y la regla del curso pide SecureStore; documentar esa diferencia es parte de la decisión. También aprendí a contrastar la respuesta de la IA: Gemini se contradijo y sugirió librerías que no funcionan en Expo Go.

### Entrada #6
- Fecha: 2026-11-06
- Integrante: Fray Sebastián Benítez Rodríguez
- Herramienta: Gemini
- Objetivo: Revisar de forma crítica el SessionContext conectado a Firebase (onAuthStateChanged + onSnapshot de drivers/{uid}) antes de hacer el commit: cierre de las escuchas, errores al cerrar sesión, carga sin internet y la decisión de tratar cualquier status distinto de "approved" como "pending".
- Prompt: "Sigo con mi UberClone versión conductor (Expo SDK 58, JavaScript, Expo Go en iPhone, React Navigation 7, Firebase JS SDK 13 con la sesión guardada en AsyncStorage). Ya tengo inicio de sesión con correo y contraseña y reglas de Firestore donde cada conductor solo lee su documento drivers/{uid}.

  Ahora reemplacé el estado simulado de mi SessionContext por el real. Escucha onAuthStateChanged y, si hay usuario, hace onSnapshot de drivers/{uid}: si no existe el documento el estado es "unregistered", si status es "approved" es "approved" y cualquier otro valor es "pending". RootNavigator muestra una carga mientras isLoading es true, una pantalla de error con botón de salir si error tiene valor, y si no, la rama de navegación según el estado.

  Este es el código:

  ```js
  // src/context/SessionContext.js
  // Context de sesión: dice en qué situación está el conductor para que la
  // navegación raíz (RootNavigator) decida qué pantallas mostrar.
  // Escucha a Firebase en tiempo real:
  //   1) onAuthStateChanged: ¿hay un usuario con sesión iniciada?
  //   2) onSnapshot de drivers/{uid}: ¿ya envió su registro? ¿está aprobado?
  // Si el estado cambia en la base de datos (por ejemplo, de "pending" a
  // "approved" desde la consola), la app cambia de pantalla sola.
  // AI-assisted: see docs/AI_LOG.md #6
  import React, { createContext, useEffect, useMemo, useState } from 'react';
  import { onAuthStateChanged } from 'firebase/auth';
  import { doc, onSnapshot } from 'firebase/firestore';
  import { auth, db } from '../config/firebase';

  // Estados posibles del conductor, en el orden en que avanza.
  export const DRIVER_STATUS = Object.freeze({
    SIGNED_OUT: 'signedOut', // sin sesión
    UNREGISTERED: 'unregistered', // tiene cuenta, pero no ha enviado el registro
    PENDING: 'pending', // registro enviado, esperando aprobación
    APPROVED: 'approved', // aprobado: puede usar la app
  });

  // Traduce el documento del conductor a un estado de la navegación.
  // Solo "approved" da acceso al menú: cualquier otro valor se trata como
  // pendiente (ante un dato raro se niega el acceso en vez de darlo).
  function statusFromSnapshot(snapshot) {
    if (!snapshot.exists()) {
      return DRIVER_STATUS.UNREGISTERED;
    }
    return snapshot.data().status === 'approved' ? DRIVER_STATUS.APPROVED : DRIVER_STATUS.PENDING;
  }

  export const SessionContext = createContext(null);

  export function SessionProvider({ children }) {
    const [user, setUser] = useState(null);
    const [driverStatus, setDriverStatus] = useState(DRIVER_STATUS.SIGNED_OUT);
    // Empieza en true: al abrir la app, Firebase tarda un momento en decir si
    // había una sesión guardada. Sin esto se vería el login por un instante.
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      // Escucha del documento del conductor; se cambia cada vez que cambia el usuario.
      let unsubscribeDriver = null;
      const stopDriverListener = () => {
        if (unsubscribeDriver) {
          unsubscribeDriver();
          unsubscribeDriver = null;
        }
      };

      const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
        // Cambió el usuario (inició o cerró sesión): se cierra la escucha anterior
        // para no seguir leyendo el documento de otra persona.
        stopDriverListener();
        setUser(firebaseUser);
        setError(null);

        if (!firebaseUser) {
          setDriverStatus(DRIVER_STATUS.SIGNED_OUT);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        unsubscribeDriver = onSnapshot(
          doc(db, 'drivers', firebaseUser.uid),
          (snapshot) => {
            setDriverStatus(statusFromSnapshot(snapshot));
            setError(null);
            setIsLoading(false);
          },
          (snapshotError) => {
            console.log('Error escuchando el documento del conductor:', snapshotError.code);
            setError('No se pudo cargar tu información. Revisa tu conexión e intenta de nuevo.');
            setIsLoading(false);
          }
        );
      });

      // Limpieza: al desmontar el Provider se cierran las dos escuchas.
      return () => {
        unsubscribeAuth();
        stopDriverListener();
      };
    }, []);

    // useMemo: el objeto solo se crea de nuevo cuando cambia algún dato, así las
    // pantallas que usan el contexto no se vuelven a dibujar sin necesidad.
    const value = useMemo(
      () => ({ user, driverStatus, isLoading, error }),
      [user, driverStatus, isLoading, error]
    );

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
  }

  // ----- src/navigation/RootNavigator.js -----
  // src/navigation/RootNavigator.js
  // Navegación raíz: según el estado del conductor (SessionContext) solo existe
  // una de las ramas. Un conductor que no está "approved" nunca tiene el Drawer
  // montado, así que no puede llegar a Inicio ni ponerse disponible (enunciado §2).
  // AI-assisted: see docs/AI_LOG.md #3
  import React from 'react';
  import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
  import { createNativeStackNavigator } from '@react-navigation/native-stack';
  import useSession from '../hooks/useSession';
  import { DRIVER_STATUS } from '../context/SessionContext';
  import RegisterTabs from './RegisterTabs';
  import MainDrawer from './MainDrawer';
  import PlaceholderScreen from '../components/PlaceholderScreen';
  import LoginScreen from '../screens/auth/LoginScreen';
  import SignOutButton from '../components/SignOutButton';

  const Stack = createNativeStackNavigator();

  export default function RootNavigator() {
    const { driverStatus, isLoading, error } = useSession();

    // Mientras Firebase confirma la sesión y el estado del conductor, se muestra
    // una carga: así no aparece el login por un instante a quien ya tenía sesión.
    if (isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#111827" />
        </View>
      );
    }

    // Si no se pudo leer el estado (sin conexión, permisos), se explica y se
    // deja cerrar sesión, en vez de mostrar una pantalla que no corresponde.
    if (error) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <SignOutButton />
        </View>
      );
    }

    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {driverStatus === DRIVER_STATUS.SIGNED_OUT && (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
        {driverStatus === DRIVER_STATUS.UNREGISTERED && (
          <Stack.Screen name="Register" component={RegisterTabs} />
        )}
        {driverStatus === DRIVER_STATUS.PENDING && (
          <Stack.Screen
            name="Pending"
            component={PlaceholderScreen}
            options={{
              headerShown: true,
              title: 'Pendiente de aprobación',
              headerRight: () => <SignOutButton />,
            }}
          />
        )}
        {driverStatus === DRIVER_STATUS.APPROVED && <Stack.Screen name="Main" component={MainDrawer} />}
      </Stack.Navigator>
    );
  }

  const styles = StyleSheet.create({
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: '#FFFFFF',
    },
    errorText: {
      marginBottom: 16,
      fontSize: 15,
      textAlign: 'center',
      color: '#DC2626',
    },
  });
  ```

  Mis dudas:
  1. ¿Se cierran bien las escuchas? Cuando el usuario cierra sesión o cambia de usuario, ¿puede quedar viva la escucha del documento anterior o llegar un dato del usuario anterior?
  2. Al cerrar sesión, ¿el onSnapshot puede disparar un error de permisos antes de que onAuthStateChanged avise? ¿Lo estoy manejando bien al limpiar el error?
  3. ¿Es correcto poner isLoading en true otra vez cada vez que cambia el usuario? ¿Hay parpadeos o casos donde se quede cargando para siempre (por ejemplo, sin internet)?
  4. ¿Tratar cualquier status distinto de "approved" como "pending" es una buena decisión de seguridad?

  No me digas que está bien si no lo está. Busca errores, condiciones de carrera, fugas de memoria, casos que fallen en Android e iOS y lo que haría distinto un desarrollador senior. Si todo está correcto, dime qué casos probaría para comprobarlo. No me sugieras instalar librerías nuevas."
- Resumen de la respuesta: Gemini consideró correcto el cierre de las escuchas (stopDriverListener al cambiar de usuario y en la limpieza del useEffect). Confirmó que al cerrar sesión el onSnapshot puede disparar un error `permission-denied` antes de que se cierre la escucha, lo que mostraría por un instante el mensaje de error rojo, y propuso ignorar el error si `auth.currentUser` ya es null. Sobre la carga sin internet, dijo que onSnapshot se quedaría esperando la red y la app quedaría en la pantalla de carga para siempre, y propuso usar `getDoc` con un tiempo de espera de 5 a 8 segundos. Calificó como correcta (fail-secure) la decisión de tratar cualquier status distinto de "approved" como "pending". Sugirió probar: arranque en modo avión, cambio de status en vivo desde la consola y cierre de sesión sin mensaje de error.
- Qué se usó / modificó / descartó: Se usó la condición `if (!auth.currentUser) return;` en el callback de error del onSnapshot. Se mantuvo la decisión fail-secure. Se corrigió el diagnóstico de Gemini sobre la carga sin internet: el SDK de Firestore no se queda esperando, sino que responde desde su caché con `snapshot.metadata.fromCache` en true y, como el documento no está en la caché, `snapshot.exists()` da false; el problema real era que la app mandaba al conductor a las pestañas de registro como si no estuviera registrado. Se agregó la condición `if (!snapshot.exists() && snapshot.metadata.fromCache)`, que muestra "Sin conexión. Conéctate a internet para cargar tu información." en vez de cambiar de pantalla. Se descartaron `getDoc` con tiempo de espera (se pierde el cambio de estado en tiempo real) y la prueba en modo avión.
- Archivos y commit: src/context/SessionContext.js, src/navigation/RootNavigator.js, src/components/SignOutButton.js, src/navigation/RegisterTabs.js, src/screens/auth/LoginScreen.js — b16aeeb
- Verificación: En el iPhone con la cuenta prueba1: la sesión guardada abre directo en las pestañas de registro (captura 23), "Salir" vuelve al login (captura 24) e iniciar sesión vuelve a las pestañas (captura 25). Se creó el documento drivers/{uid} con status "pending" en la consola (captura 26) y al cambiar el status desde la consola la app pasó sola a "Pendiente de aprobación", al menú (approved) y de nuevo a pendiente (capturas 27 a 29). Las dos condiciones de la corrección se revisaron en el código del PC antes del commit.
- Aprendizaje: Una escucha en tiempo real necesita manejar tres momentos: cuando llega el dato, cuando falla y cuando se cierra la sesión, porque el cierre de sesión también produce un error de permisos que no se le debe mostrar al usuario. Sin conexión, Firestore responde desde la caché, así que "el documento no existe" no siempre significa que el conductor no se ha registrado; `metadata.fromCache` permite distinguirlo. También comprobé que la IA puede acertar en un punto y equivocarse en otro de la misma respuesta.

### Entrada #7
- Fecha: 2026-11-09
- Integrante: Fray Sebastián Benítez Rodríguez
- Herramienta: Claude
- Objetivo: Encontrar y corregir por qué, al cerrar sesión y volver a entrar con una cuenta sin registro (prueba2), la app se quedaba en "Sin conexión. Conéctate a internet para cargar tu información." aunque el celular tenía internet.
- Prompt: "cada vez que salgo y trato de volver a entrar, me dice que me conecte a internet" — "si corrige, porque pues igual yo puedo entrar con prueba 1 pero si yo creo prueba 2 o prueba 3 y en el firebase no esta actualizado esa info no debe ser que no me deje entrar despues y me dihas ese comentario" — "(y esto como lo solucioinamos) ?" (sobre el aviso "Sin conexión" que aparecía un instante) — "[captura de la pantalla Sin conexión con prueba2] mira esto es lo que no debe aprecer en prueba2" — "no, no aprece nada en el visual cuando hago lo que pides" (la terminal de Expo no mostraba mensajes de Firebase)
- Resumen de la respuesta: Claude explicó que el aviso salía de la condición `!snapshot.exists() && snapshot.metadata.fromCache` (entrada #6) y propuso el arreglo en tres pasos. Primero, `includeMetadataChanges: true` en el onSnapshot, porque por defecto Firestore no vuelve a avisar cuando solo cambia `fromCache`. Segundo, un temporizador de 5 segundos antes de mostrar "Sin conexión", que se cancela al llegar una respuesta, al haber un error o al cerrar sesión. Como con eso seguía fallando, concluyó que el canal de streaming de Firestore no se reconectaba en React Native después de cerrar sesión y propuso `initializeFirestore(app, { experimentalForceLongPolling: true })`.
- Qué se usó / modificó / descartó: Se usaron los tres cambios. El primer diagnóstico de Claude (solo `includeMetadataChanges`) estaba incompleto y la prueba en el iPhone lo demostró: el servidor no respondía ni después de 5 segundos. Por eso se pasó a long polling. A `initializeFirestore` se le agregó un `try/catch` que reutiliza `getFirestore`, porque con Fast Refresh no se puede inicializar dos veces. Se descartó subir el tiempo de espera, porque no arreglaba la causa. Se descartó también buscar el error en la terminal, porque Expo Go no mostró los mensajes de Firebase.
- Archivos y commit: src/context/SessionContext.js (includeMetadataChanges y temporizador OFFLINE_WAIT_MS), src/config/firebase.js (long polling) — 6846046
- Verificación: En el iPhone, con long polling: prueba2 entra a las pestañas del registro, sale con "Salir" y vuelve a entrar varias veces sin que aparezca "Sin conexión". prueba1 abre "Pendiente de aprobación" y, al cambiar su status a "approved" en la consola de Firebase, la app pasó sola al menú (el tiempo real sigue funcionando con long polling). `npm test`: 34 passed.
- Aprendizaje: Un error que solo aparece después de cerrar sesión y volver a entrar no se ve en la primera prueba: hay que repetir el flujo completo. `onSnapshot` no avisa cuando solo cambian los metadatos si no se pide con `includeMetadataChanges`. En React Native el SDK web de Firestore puede necesitar long polling para reconectarse. Además, un `setTimeout` que no se cancela sigue vivo aunque la sesión haya cambiado. Este error no lo habría resuelto sin ayuda, y la primera solución de la IA tampoco era la definitiva: solo probándolo en el celular se encontró la causa real.

### Entrada #8
- Fecha: 2026-11-10
- Integrante: Fray Sebastián Benítez Rodríguez
- Herramienta: Gemini
- Objetivo: Revisar de forma crítica las nuevas reglas de Firestore que validan los campos del registro del conductor (drivers/{uid}) antes de publicarlas.
- Prompt: "Actúa como revisor senior de seguridad de Firebase. Necesito una revisión CRÍTICA de mis reglas de Cloud Firestore. No me digas que está bien si no lo está: si algo falla, explícame el escenario concreto en que falla y cómo corregirlo." + contexto de la app, forma del documento drivers/{uid}, las reglas completas y 9 preguntas: auto-aprobación, operador ternario, createdAt == request.time, request.auth.token.email, vigencia de documentos en el update, revisión técnico-mecánica en null, campos faltantes, límites del lenguaje y revisión general.
- Resumen de la respuesta: Gemini confirmó que nadie puede aprobarse solo ni cambiar el status de otro conductor. Señaló que exigir licencia y SOAT vigentes en el update bloquearía a un conductor aprobado cuando le venza un documento, propuso comparar el correo con lower() y exigir que la fecha y la foto de la revisión técnico-mecánica vayan juntas. También afirmó que el operador ternario no existe en las reglas, que createdAt == request.time falla al azar por latencia (propuso createdAt is timestamp), que hasOnly detecta campos faltantes y que el límite es de 20.000 operaciones.
- Qué se usó / modificó / descartó: Se usaron tres sugerencias: la vigencia de los documentos solo se exige al crear (hasValidDocumentsToday), el correo se compara con lower() y la revisión técnico-mecánica se valida como fecha y foto juntas o ambas en null (isValidTechnicalReview). Se descartaron cuatro afirmaciones por ser incorrectas según la documentación de Firebase: el ternario sí existe desde 2020 (las reglas publicaron sin error); createdAt == request.time es la forma correcta de exigir serverTimestamp(), y cambiarlo por "is timestamp" permitiría poner una fecha inventada; hasOnly no detecta campos faltantes, por eso se creó hasExactly (hasOnly + hasAll); el límite real es de 1.000 expresiones por petición y 20 niveles de llamadas a funciones.
- Archivos y commit: firestore.rules — commit "Validar campos del registro en las reglas de Firestore y agregar entrada 8 de la bitacora"
- Verificación: Las reglas se publicaron en la consola de Firebase sin errores de compilación, lo que confirma que el operador ternario es válido. El primer intento falló con "Line 66: mismatched input '<EOF>'" porque el texto se pegó incompleto (solo 66 de 130 líneas); se volvió a copiar desde VS Code y publicó bien.
- Aprendizaje: Las reglas de Firestore son la verdadera seguridad de la app: la validación de la app se puede saltar, la del servidor no. La IA se equivocó con seguridad en cuatro puntos, y uno de sus "arreglos" (createdAt is timestamp) habría debilitado la protección. Por eso cada afirmación se comprobó con la documentación oficial antes de aceptarla. También aprendí a leer un error de compilación: "<EOF>" significa que el texto terminó antes de tiempo, no que la regla esté mal.

### Entrada #9
- Fecha: 2026-11-10
- Integrante: Fray Sebastián Benítez Rodríguez
- Herramienta: Gemini
- Objetivo: Revisar de forma crítica la pantalla Inicio del conductor aprobado antes de subirla: el hook useDriverLocation (GPS con expo-location, envío de la ubicación cada 5 s y limpieza del useEffect), la pantalla HomeScreen con el mapa y el interruptor Disponible, y las reglas de Firestore de driverLocations.
- Prompt: "Actúa como revisor senior de React Native y Firebase. Necesito una revisión CRÍTICA del código de la pantalla de Inicio de una app de conductores (estilo Uber). No me digas que está bien si no lo está: si algo falla, explícame el escenario concreto en que falla y cómo corregirlo." + contexto (Expo SDK 58, expo-location, react-native-maps, Firebase 13, requisitos del enunciado y decisiones tomadas), el código completo de location.js, locationDocument.js, locationService.js, preferencesService.js, useDriverLocation.js y HomeScreen.js, las reglas de driverLocations y 9 preguntas: limpieza de watchPositionAsync, useIsFocused en el Drawer, dependencias del efecto, escritura en Firestore desde la limpieza y al cerrar sesión, restaurar Disponible desde AsyncStorage, costo del get() en las reglas, timeInterval en iOS, el mapa en Android y revisión general.
- Resumen de la respuesta: Gemini confirmó que useIsFocused es la forma correcta de detectar si Inicio está a la vista en el Drawer, que leer la posición desde un useRef evita valores viejos en el setInterval, que en iOS el timeInterval no funciona y que el mapa nunca se dibuja sin posición. Señaló que al cerrar sesión la escritura de "No disponible" falla y el conductor queda como disponible "fantasma", que restaurar Disponible al abrir la app puede ser un riesgo, y que con la app minimizada iOS pausa el setInterval. También afirmó que había una fuga de memoria en la limpieza, propuso cambiar el get() de las reglas por "resource != null" para ahorrar lecturas y repitió que updatedAt == request.time falla por latencia.
- Qué se usó / modificó / descartó: Se usó una protección para ignorar avisos del GPS que lleguen después de la limpieza (if (isCancelled) return). Para el conductor "fantasma" se descartó el arreglo de Gemini (if (uid) no cambia nada, porque uid nunca es null) y se hizo uno propio: "Cerrar sesión" en el menú marca primero No disponible y después cierra la sesión, y la limpieza solo escribe si todavía hay sesión (auth.currentUser). Se documentó en el README que con la app minimizada se pausa el envío. Para restaurar Disponible al abrir la app se mantuvo el comportamiento, porque lo pide el enunciado (H7: AsyncStorage para el último estado de disponibilidad). Se descartaron tres afirmaciones: la fuga de memoria (el código ya cerraba la suscripción que llega tarde y la app usa Hermes, no JavaScriptCore); cambiar el get() por "resource != null", porque un conductor no aprobado podría crear su documento en false y luego cambiarlo a true, saltándose R6; y "updatedAt is timestamp", el mismo error ya refutado en la entrada 8.
- Archivos y commit: src/config/location.js, src/utils/locationDocument.js, src/utils/__tests__/locationDocument.test.js, src/services/locationService.js, src/services/preferencesService.js, src/hooks/useDriverLocation.js, src/screens/main/HomeScreen.js, src/navigation/TripStack.js, src/navigation/MainDrawer.js, firestore.rules, app.json, README.md — commit "Agregar pantalla Inicio con mapa, interruptor Disponible y envio de ubicacion en tiempo real a driverLocations, con reglas y entrada 9 de la bitacora"
- Verificación: En el iPhone con la cuenta prueba1 (approved): el mapa muestra el punto azul con la ubicación; al activar Disponible, driverLocations/{uid} queda con isAvailable true, la ubicación y updatedAt cambiando cada ~5 s (captura 54, con las coordenadas tapadas); al ir a Historial queda isAvailable false y location null (captura 53) y al volver a Inicio se reanuda; al cerrar y abrir Expo Go, Inicio abre ya en Disponible (AsyncStorage); al tocar Cerrar sesión queda isAvailable false y location null.
- Aprendizaje: La limpieza de un useEffect no es solo "apagar": hay que pensar qué pasa si algo asíncrono termina después (la suscripción del GPS que llega tarde) y en qué orden ocurren las cosas (marcar No disponible antes de cerrar sesión, porque después las reglas ya no lo permiten). También aprendí que una pantalla del Drawer no se desmonta al cambiar de opción, por eso hace falta useIsFocused. Otra vez la IA propuso un "ahorro" que rompía la seguridad (quitar el get() de las reglas), y solo se detectó pensando cómo lo usaría alguien que no está aprobado.

### Entrada #10

- **Fecha:** 10–11/11/2026
- **Integrante:** Fray Sebastián Benitez
- **Herramienta:** Claude (Anthropic), en conversación; sin revisión de Gemini por decisión propia.
- **Objetivo:** Crear un simulador de la "app del pasajero" (que no existe en este proyecto) para generar solicitudes de viaje (`trips` en estado `requested`) que la app del conductor pueda recibir, sin poner la llave de administrador dentro de la app, y las reglas de Firestore que permiten al conductor leer y responder solo sus solicitudes.

- **Prompt (textual, mensajes principales):**
  1. "yo elijo la A y si las dos proppuestas estan ben siempre y cuando las resolvamos con teoria de clase" (opción A: backend Node aparte con un script que crea las solicitudes).
  2. "apruebo las 3" (origen a ≤ 1 km del conductor y destino a 2–6 km; direcciones con Nominatim; método de pago aleatorio o forzado por argumento).
  3. "si quiero las dos mejoras, pero la de descricion mas compelta" (mostrar por qué se descarta cada conductor; dirección más completa).
  4. "aporbado" (reintento ante fallos de red pasajeros) y "aprobado" (sacar el reintento a un cliente HTTP compartido).
  5. "1A, 5 s" (respuesta con un solo campo `respondedAt`; margen de 5 s para aceptar) y "aprobado sin gemin" (reglas de `trips`).

- **Resumen:** Claude propuso el diseño del documento `trips` según el enunciado (§6) y el código del backend: config, conexión de administrador, servicios de rutas (OSRM) y direcciones (Nominatim), funciones puras y el script `npm run solicitud`. Las pruebas reales mostraron tres problemas (cuenta sin categoría, dirección muy corta, fallos de red intermitentes) que se resolvieron con mejoras aprobadas una por una. Después propuso las reglas de `trips` con mínimo privilegio, probadas en el Área de prueba de reglas.

- **Qué se usó / modificó / descartó:**
  - **Se usó:** backend Node separado con `firebase-admin` + `dotenv`. La llave se lee desde una ruta en `backend/.env`; ninguno de los dos va a Git.
  - **Se usó:** OSRM y Nominatim en vez de Google, porque Directions/Distance Matrix son *Legacy* y Routes API exige facturación (el enunciado §7 permite OSRM/Nominatim).
  - **Se usó:** el script revisa lo mismo que las reglas (`approved`, ubicación < 30 s, categoría válida, sin viaje activo), porque `firebase-admin` se salta las reglas.
  - **Se usó:** la tarifa NO se guarda en la solicitud; la app la calculará con `calculateFare` (la misma función al estimar y al cobrar).
  - **Se usó:** reglas de `trips` con mínimo privilegio: el conductor solo lee sus viajes; solo puede pasar `requested` → `accepted`/`rejected`; solo cambian `status` y `respondedAt` (`diff().affectedKeys()`); `respondedAt` es la hora del servidor; aceptar solo hasta 20 s después de `createdAt` (15 s + 5 s de margen), verificado en el servidor; crear y borrar solo desde el backend.
  - **Se modificó (tras pruebas):** motivo de descarte por conductor; dirección "Lugar, Calle # número, Barrio, Ciudad" con respaldo en `display_name`; cliente HTTP compartido (`httpClient.js`) con timeout, 1 reintento (red, 429, 5xx; no 400/404) y la causa real del error (`error.cause`).
  - **Se descartó:** importar `src/config/location.js` desde el backend (usa `export` y el backend usa `require`); el valor de 30 s se repite con un comentario que indica su origen.
  - **Se descartó:** cambiar la configuración de red de Node (IPv6) sin pruebas: tres pruebas directas a OSRM respondieron bien, así que solo se agregó el reintento y la causa del error.
  - **Se descartó:** aprobar `install-scripts` de `@firebase/util` y `protobufjs` (no se necesitan; mínimo privilegio).
  - **Se descartó:** dos campos `acceptedAt`/`rejectedAt` (con uno basta: el `status` dice cuál fue la respuesta).

- **Archivos y commit:** backend: `.gitignore`, `backend/package.json`, `backend/package-lock.json`, `backend/.env.example`, `backend/README.md`, `backend/scripts/createTripRequest.js`, `backend/src/config.js`, `backend/src/firebaseAdmin.js`, `backend/src/services/httpClient.js`, `backend/src/services/routeService.js`, `backend/src/services/geocodingService.js`, `backend/src/utils/tripRequest.js` — commit `094c422`. Reglas: `firestore.rules` — commit `1a3ab66`.

- **Verificación:**
  - Revisión de sintaxis de todos los archivos y pruebas con datos simulados: puntos aleatorios siempre entre 200 y 1000 m; 8.500 m / 1.320 s → 8,5 km / 22 min; ruta de 0 km rechazada; método de pago inválido rechazado; 6 casos de dirección; 7 casos de reintento (fallo de red, 429, 503, 400, respuesta sin ruta, éxito).
  - Pruebas reales con `npm run solicitud` y el iPhone en Disponible:
    - prueba1 fue descartada por no tener categoría de vehículo (cuenta anterior al formulario); se aprobó prueba2 en la consola, como indica R6.
    - Con un viaje activo, el script mostró "ya tiene un viaje activo" con el id del viaje.
    - Se crearon viajes en `trips` con `status: "requested"`, `distanceKm`, `durationMin` entero, `routePolyline`, `passengerId: "simulated-passenger"` y `createdAt`, revisados campo por campo en la consola de Firebase.
    - Hubo dos fallos reales `fetch failed` (uno en Nominatim, otro en OSRM) antes del reintento; después del cliente compartido, el viaje se creó con las dos direcciones legibles.
  - `git add --dry-run` confirmó que la llave, `.env` y `node_modules` no entran al repositorio.
  - Reglas de `trips` en el Área de prueba de reglas de la consola: `get` del conductor dueño → permitido; `get` de otro conductor, `create`, `delete` y `update` de una solicitud vencida → denegados. El caso positivo (aceptar/rechazar a tiempo con `serverTimestamp`) no se puede simular ahí y se prueba desde la app en el commit siguiente.

- **Aprendizaje:**
  - Un servidor con permisos de administrador debe validar por sí mismo lo que las reglas validarían.
  - Separar "obligatorio" de "opcional": sin ruta no hay solicitud; sin dirección se usan coordenadas.
  - Un mensaje de error útil dice qué pasó y cómo arreglarlo: el motivo de descarte habría ahorrado dos diagnósticos.
  - El reintento va en un solo lugar, para que ningún servicio se quede sin él.
  - Los datos de prueba también deben estar completos.
  - El temporizador del celular no es una garantía: el plazo para aceptar se verifica también en el servidor.

### Entrada #11

- **Fecha:** 11/11/2026
- **Integrante:** Fray Sebastián Benitez
- **Herramienta:** Claude (Anthropic), en conversación; sin revisión de Gemini.
- **Objetivo:** Recibir en la app las solicitudes de viaje en tiempo real y mostrarlas en la pantalla Solicitud (S2) con la tarifa y la ganancia estimadas, un temporizador de 15 s y los botones Aceptar / Rechazar, usando el hook obligatorio `useTripRequests`.

- **Prompt (textual, mensajes principales):**
  1. "las dos recoemndadas" (el tiempo se cuenta desde `createdAt`, la misma referencia de las reglas; las solicitudes vencidas con la app cerrada las rechaza la app al abrir).
  2. "aprobado" (código de la pantalla, el hook, el servicio y las funciones puras).

- **Resumen:** Claude propuso la estructura por capas (config, funciones puras con pruebas, servicio de Firestore, hook y pantalla) y el código. La pantalla calcula la estimación con `calculateFare` (la misma función del cobro final), cuenta 15 s desde `createdAt` y rechaza sola al llegar a 0. El hook rechaza sin mostrarlas las solicitudes vencidas o con datos inválidos.

- **Qué se usó / modificó / descartó:**
  - **Se usó:** `parseTripRequest` valida los datos que llegan de Firestore (tipos, categoría, método de pago, km y min > 0, direcciones, fecha) antes de usarlos; con `hasOwnProperty` y no `in`, para que "constructor" no pase como categoría.
  - **Se usó:** temporizador desde `createdAt` con `getSecondsLeft` (nunca menos de 0 ni más de 15); `setInterval` con cleanup (H2).
  - **Se usó:** `useCallback` para Aceptar y Rechazar (H5), `useMemo` para la estimación y `useRef` para que no se responda dos veces (doble toque o rechazo automático justo después de aceptar).
  - **Se usó:** la pantalla Solicitud sin botón ni gesto de "atrás": el conductor debe responder. Al aceptar se usa `replace` para no volver a una solicitud ya aceptada.
  - **Se usó:** si las reglas niegan la respuesta (`permission-denied`), se muestra "La solicitud ya venció o ya no está disponible" y no se reintenta; si es un error de red, se puede reintentar.
  - **Se descartó:** contar los 15 s desde que la solicitud llega al celular (podía mostrar tiempo que el servidor ya no acepta).
  - **Se descartó:** limpiar las solicitudes vencidas desde el backend (basta con la app: el script solo elige conductores con la app abierta en Inicio).
  - **Se descartó:** el mapa con la ruta en esta pantalla (S2 pide datos; la ruta se dibuja en la rama del viaje).
  - **Se descartó:** una marca `AI-assisted` agregada en `HomeScreen.js` sin aprobación; se revirtió y el archivo quedó como se aprobó.

- **Archivos y commit:** `src/config/tripRequest.js`, `src/utils/tripRequestData.js`, `src/utils/__tests__/tripRequestData.test.js`, `src/services/tripService.js`, `src/hooks/useTripRequests.js`, `src/screens/main/TripRequestScreen.js`, `src/screens/main/HomeScreen.js`, `src/navigation/TripStack.js` — commit "feat(solicitudes): useTripRequests y pantalla de solicitud con temporizador de 15 s".

- **Verificación:**
  - `npm test`: 64 pruebas pasando (14 nuevas: documento válido, distancia 0/negativa/texto, categoría o pago desconocidos, sin dirección o sin fecha, estado distinto, segundos restantes 15/13/1/0, reloj atrasado, formato de pesos).
  - En el iPhone con prueba2 y `npm run solicitud`:
    1. Solicitud vencida de antes: se rechazó sola al ponerse Disponible, sin mostrarse (`rejected` con `respondedAt`).
    2. Aceptar: `accepted` 5 s después de `createdAt`; se abrió "Viaje en curso". Prueba el caso positivo de las reglas que el Área de prueba no podía simular.
    3. Rechazar: `rejected`; volvió a Inicio.
    4. Sin tocar: el temporizador se puso rojo en los últimos 5 s; en 0 quedó `rejected` y volvió solo a Inicio.
  - Tarifas de la pantalla comparadas a mano con la fórmula: 7 km/16 min → 15.900 / 3.180 / 12.720; 5,4 km/10 min → 12.480 redondeado a 12.500 / 2.500 / 10.000; 6,2 km/14 min → 14.440 redondeado a 14.400 / 2.880 / 11.520.
  - En el commit 1 de la rama, el reintento mostró la causa real de los fallos de red intermitentes: `ENOTFOUND` (DNS de la red local), no del código.

- **Aprendizaje:**
  - El celular y el servidor deben usar la misma referencia de tiempo: si el temporizador cuenta distinto que las reglas, la app puede prometer tiempo que el servidor no acepta.
  - Una solicitud que nadie responde no debe quedar abierta para siempre: el sistema debe cerrarla.
  - `useRef` sirve para lo que debe cambiar al instante sin volver a dibujar la pantalla (evitar dos respuestas).
  - Lo que se monta debe ser exactamente lo aprobado.

### Entrada #12

- **Fecha:** 11/11/2026
- **Integrante:** Fray Sebastián Benitez
- **Herramientas:** Claude (Anthropic) para el diseño y el código; Gemini (Google) para la revisión crítica del commit 4.
- **Objetivo:** Implementar el viaje en curso (enunciado S3, E1, H3, G2, T7): viaje activo compartido con un Context, reglas de Firestore para cada paso del viaje y la pantalla Viaje en curso con rutas en el mapa, "Pasajero a bordo", "Finalizar" con la tarifa final y "Cancelar viaje".

- **Prompt (textual, mensajes principales):**
  1. "decisiones 1A 2A (aqui tengo una duda, cuando el conductor ya va llegando al destino de dejar al pasajero, hoy en dias las aplicaciones le empiezan a asignar otro viaje) 3A 4A" (ruta hasta el pasajero con una llamada a OSRM; sin escribir la ubicación durante el viaje; guardar la tarifa al finalizar; cancelar antes de que suba el pasajero).
  2. "no encadenemos viajes es que se complica la cosa proced".
  3. "aprobado" (ActiveTripContext) y "a" (que el servidor recalcule la tarifa con la misma fórmula).
  4. "sigamos con el commit 4 y ese le hacemos parrevie en gemini y las dudas por que como dices e sun cambio grande".
  5. Prompt a Gemini (textual, sin el código): "Actúa como revisor de código CRÍTICO (peer review) de un proyecto académico de Desarrollo Móvil. No reescribas todo: señala problemas concretos con el archivo y la línea, explica por qué son un problema y propone el cambio mínimo. Si algo está bien, dilo. Cuando una afirmación dependa de una versión o de la documentación, cita la documentación oficial (React Navigation 7, Firebase/Firestore Security Rules, Expo SDK 58, react-native-maps). No inventes APIs: si no estás seguro, dilo." + contexto, requisitos del enunciado, las 5 decisiones tomadas y 6 preguntas (usePreventRemove en iOS y el orden con la navegación; carreras entre updateDoc y onSnapshot; expectedFare: entero vs decimal, `let`, mapa literal y `commission * 5 == fare`; limpieza de efectos y AbortController en Expo SDK 58; rendimiento de fitToCoordinates y useMemo; seguridad y manejo de errores), seguido del código completo de los archivos del commit 4, el Context, polyline, calculateFare, pricing y el bloque de reglas de `trips`.
  6. "aprobado" (cambios después de la revisión de Gemini).

- **Resumen:** Claude propuso dividir la rama en 4 commits: decodificador de rutas, viaje activo con Context, reglas de cada transición del viaje con la tarifa recalculada en el servidor, y la pantalla Viaje en curso. Gemini revisó el commit 4. De sus 6 puntos, 3 se aceptaron, 2 se descartaron por estar equivocados y 1 tenía razón en el riesgo pero proponía un arreglo que no lo resolvía. Al revisar su respuesta se encontró un problema que Gemini no vio: la pantalla salía antes de que el servidor confirmara Finalizar.

- **Qué se usó / modificó / descartó:**
  - **Se usó:** `decodePolyline` propio (sin librerías) con 4 pruebas.
  - **Se usó:** `ActiveTripContext` (H3): si la app se cierra a mitad del viaje, vuelve sola a Viaje en curso; mientras haya viaje activo, Inicio no se pone Disponible ni escucha solicitudes.
  - **Se usó:** reglas por transición: `accepted → driver_arriving → in_progress → completed` y `cancelled` solo antes de `in_progress`, cada paso con sus campos exactos (`diff().affectedKeys().hasOnly`). Al finalizar, el servidor recalcula la tarifa (`expectedFare()`) y valida comisión 20 %, propina 0 y ganancia.
  - **Se usó:** pantalla con la ruta hasta el pasajero (una sola llamada a OSRM, con `AbortController`) y la ruta del viaje (`Polyline`), `usePreventRemove` y sin gesto ni botón de atrás; la tarifa final se calcula con `calculateFare` (`buildCompletionData`, 4 pruebas).
  - **Se usó (de Gemini):** la confirmación de que `AbortController`, la limpieza con `isCancelled` y los `useMemo` estaban bien.
  - **Se modificó (de Gemini, con otro arreglo):** el paso automático a `driver_arriving` podía enviarse dos veces; Gemini propuso `isMounted`, que no evita la segunda escritura; se usó un `useRef` con el id del viaje.
  - **Se modificó (encontrado al revisar a Gemini):** Firestore aplica la escritura en el celular antes de que el servidor responda; la pantalla ahora espera la confirmación del servidor antes de salir. Si las reglas rechazan, el viaje vuelve y se muestra el error.
  - **Se descartó (Gemini):** navegar justo después del `await` en Finalizar: `usePreventRemove` bloquearía ese `replace` mientras el viaje siga activo.
  - **Se descartó (Gemini):** que el mapa literal `{...}[categoría]` sea un error de sintaxis y que la comparación entero/decimal falle: las reglas se publicaron sin error, la referencia oficial documenta el operador `x[k]` y `math.round` devuelve un entero; la prueba real lo confirmó.
  - **Se descartó:** encadenar viajes (asignar otro viaje antes de terminar): no lo pide el enunciado y complica reglas, script y pantallas.

- **Archivos y commits:** `src/utils/polyline.js` y su prueba — `ebabbe9`; `src/context/ActiveTripContext.js`, `src/hooks/useActiveTrip.js`, `src/config/tripRequest.js`, `src/utils/tripRequestData.js` y su prueba, `src/services/tripService.js`, `src/navigation/MainDrawer.js`, `src/screens/main/HomeScreen.js` — `9605210`; `firestore.rules`, `src/config/pricing.js` — `d0a4c95`; `src/screens/main/TripInProgressScreen.js`, `src/services/routeService.js`, `src/config/routes.js`, `src/utils/tripCompletion.js` y su prueba, `src/services/tripService.js`, `src/navigation/TripStack.js` — `22d3017`.

- **Verificación:**
  - `npm test`: 77 pruebas pasando (13 nuevas en la rama).
  - Área de prueba de reglas: `accepted → driver_arriving` y `driver_arriving → in_progress` permitidos; `accepted → completed`, `accepted → in_progress` e `in_progress → cancelled` denegados (capturas 71–75).
  - iPhone (Expo Go, prueba2), todas bien: (1) ruta hasta el pasajero y `driver_arriving`; (2) "Pasajero a bordo" cambia a la ruta del viaje e `in_progress`; (3) al cerrar y abrir Expo Go vuelve a la misma etapa; (4) "Finalizar" guarda `fare` 18800, `commission` 3760, `driverEarnings` 15040, `tip` 0, `commissionRate` 0.2 y `completedAt` (9,6 km, 15 min, económico; la regla `expectedFare()` lo aceptó); (5) "Cancelar viaje" deja `cancelled` con `cancelledAt` y vuelve a Inicio (capturas 63–70).
  - Contexto de viaje activo: al reabrir la app con un viaje aceptado vuelve a Viaje en curso; al pasarlo a `completed` en la consola, Inicio queda libre.

- **Aprendizaje:**
  - Un revisor de IA también se equivoca: sus afirmaciones se comprueban contra la documentación oficial y con una prueba real.
  - Firestore muestra los cambios en el celular antes de que el servidor los acepte; una acción importante debe esperar la confirmación.
  - Un arreglo puede sonar bien y no resolver el problema (`isMounted` no evita una segunda escritura).
  - La tarifa que el cliente envía se valida en el servidor con la misma fórmula, no se confía en el celular.

### Entrada #13

- **Fecha:** 12/11/2026
- **Integrante:** Fray Sebastián Benitez
- **Herramienta:** Claude (Anthropic): diseño, código, guía de configuración de Mercado Pago y diagnóstico de errores. Las revisiones de Gemini están en las entradas #14 y #15.
- **Objetivo:** Cobrar los viajes con Mercado Pago Checkout Pro en modo de prueba (enunciado G1–G12): un backend que crea el cobro con el Access Token secreto y lo verifica, y la app que abre el checkout y muestra el resultado en la pantalla Cobro y resumen (S4).

- **Prompt (textual, mensajes principales):**
  1. "acepto todas las recomendadas estan bien" (verificar el pago al volver del checkout, sin webhook; el iPhone llega al backend por la misma red Wi-Fi; abrir el checkout con `expo-web-browser`; el saldo se calcula desde los viajes).
  2. "dame el promt para gemini y el paso a paso para el mercado pago".
  3. "aporbado las recomednaciones" (dividir la app en 2 commits; poder salir del resumen sin cobrar, con aviso; `openBrowserAsync`; error suave si falta la URL del backend).
  4. Durante el error 403: "pealo tu, para que no nos eqivoquemos mas" (ver Incidente).

- **Resumen:** Claude propuso que la app nunca hable con Mercado Pago: el backend (Node 22 + Express 5) crea la preferencia con el monto guardado en Firestore y `external_reference` = id del viaje, y al volver del checkout busca el pago y marca el viaje como pagado solo si el monto y la moneda coinciden. La configuración de Mercado Pago tuvo tropiezos (errores del panel y un 403) que se resolvieron con cuentas de prueba y revisando el token del `.env`.

- **Qué se usó / modificó / descartó:**
  - **Se usó:** rutas `POST /api/payments/start` y `/verify` que exigen el idToken de Firebase (`verifyIdToken`) y que el viaje sea del conductor, esté `completed`, sea por Mercado Pago y tenga tarifa entera. El monto sale de Firestore, nunca de la app.
  - **Se usó:** `summarizePayments`: aprobado solo si el monto y la moneda (COP) coinciden; `pending`, `in_process` y `authorized` cuentan como pendiente; si no, rechazado.
  - **Se usó:** llamadas a Mercado Pago con límite de tiempo y sin reintento (un POST repetido crearía dos cobros).
  - **Se usó:** API de Preferences aunque el panel avisa que "será descontinuada pronto": sigue funcionando y es la de Checkout Pro; el reemplazo (Orders) quedó anotado en el README del backend.
  - **Se usó:** en la app, `paymentService` llama al backend con el idToken y un límite de 15 s; `isValidCheckoutUrl` solo abre enlaces `https` de Mercado Pago; `openBrowserAsync` verifica solo al cerrar en iOS y hay botón "Verificar pago" (en Android la promesa termina al abrir).
  - **Se modificó:** el Jest de la app tomaba `backend/test/payment.test.js` (escrito para `node --test`) y fallaba; se agregó `"/backend/"` a `testPathIgnorePatterns`.
  - **Se descartó:** webhook de Mercado Pago: necesita una URL pública y el backend solo vive en la red local del PC.

- **Configuración de Mercado Pago (problemas y solución):**
  - "Activar credenciales" de prueba en la cuenta real mostraba "Algo salió mal" (códigos DXT40). Se usaron **cuentas de prueba** (vendedor y comprador) y las credenciales de producción del vendedor de prueba, que ya estaban activas (no mueven dinero real).
  - La pantalla "Credenciales de prueba" del vendedor de prueba también falló (DXT15).
  - El backend recibía **403** (`PA_UNAUTHORIZED_RESULT_FROM_POLICIES`). Claude primero lo atribuyó a un bloqueo de red porque `/sites/MCO` también daba 403; era un error de diagnóstico: esa ruta ya exige token. La causa real: el token del `.env` tenía 89 caracteres y el real 75 (se pegaron caracteres de más). Se reemplazó la línea con `sed` y Mercado Pago respondió 201. Además, el servidor debe reiniciarse para leer el `.env` nuevo.

- **Incidente de seguridad:** para corregir el `.env`, el Access Token de la cuenta **vendedor de prueba** se pegó en el chat. No mueve dinero real, pero se considera expuesto: se renovará en el panel y nunca se sube al repositorio (`backend/.env` está en `.gitignore`).

- **Archivos y commits:**
  - Backend: `backend/src/server.js`, `routes/payments.js`, `middleware/requireAuth.js`, `services/mercadoPagoService.js`, `services/tripPaymentService.js`, `utils/payment.js`, `config.js`, `firebaseAdmin.js`, `test/payment.test.js`, `.env.example`, `README.md`, `package.json` — commit `5147c32`.
  - App: `src/config/api.js`, `src/utils/paymentRequest.js` y su prueba, `src/services/paymentService.js`, `src/screens/main/TripSummaryScreen.js`, `.env.example`, `app.json`, `package.json` — commit `e6a6924`.

- **Verificación:**
  - Backend: `npm test` con `node --test`: 9 pruebas pasando. Con `curl`: sin token → 401 "Falta la sesión."; token falso → 401 "Sesión inválida o vencida.". `/health` respondió `{"ok":true}` desde el iPhone.
  - App: `npm test`: 91 pruebas pasando (7 nuevas de `paymentRequest`).
  - iPhone con el comprador de prueba y la Mastercard de prueba:
    1. Titular APRO: Mercado Pago aprobó la operación 188252034061; la app mostró "Viaje pagado" y "Aprobado"; en Firestore el viaje quedó `paid`, `paymentStatus: "approved"`, `paymentId: "188252034061"` (el mismo número) y `paidAt`. Tarifa 6,2 km / 15 min: 3.500 + 7.440 + 3.750 = 14.690 → 14.700, igual al cobro de Mercado Pago.
    2. Titular OTHE: Mercado Pago rechazó la operación 189325067980; la app mostró "El pago fue rechazado" y el botón para reintentar; el viaje siguió `completed` con `paymentStatus: "rejected"` y sin `paidAt`.
    3. Reintentar en el viaje rechazado y cerrar sin pagar: siguió en "Rechazado", porque el único pago de ese viaje es el rechazado.
  - Sin probar todavía: "Verificar pago" en un viaje nuevo cerrado sin pagar.

- **Aprendizaje:**
  - El secreto de una pasarela de pago vive solo en el servidor; la app pide el cobro y nunca decide el monto.
  - Un pago se confirma preguntándole a la pasarela y revisando el monto, no confiando en lo que diga la app.
  - Ante un error de una API, primero se mira la respuesta completa; un 403 no siempre es de red.
  - Un secreto pegado en un chat se considera expuesto y se renueva.

### Entrada #14

- **Fecha:** 12/11/2026
- **Integrante:** Fray Sebastián Benitez
- **Herramientas:** Gemini (Google) para la revisión crítica; Claude (Anthropic) para revisar la respuesta de Gemini contra la documentación oficial.
- **Objetivo:** Revisar el backend de pagos (commit `5147c32`) antes de montarlo: servidor Express, autenticación, servicio de Mercado Pago y reglas del cobro.

- **Prompt a Gemini (resumen fiel; el texto completo se entregó en el chat y no quedó guardado):** revisor de código crítico de un backend Node 22 + Express 5 que cobra con Mercado Pago Checkout Pro (Colombia, COP), sustentando cada punto con documentación oficial y dando archivo, línea y cambio mínimo. Se adjuntó el código de `server.js`, `routes/payments.js`, `middleware/requireAuth.js`, `services/mercadoPagoService.js`, `services/tripPaymentService.js`, `utils/payment.js` y sus pruebas, con 6 preguntas:
  1. ¿El body de `POST /checkout/preferences` es correcto para COP? ¿Se usa `sandbox_init_point` con token `TEST-`? ¿`/v1/payments/search` con `external_reference` devuelve los pagos? ¿Los nombres de los campos y estados son correctos?
  2. Seguridad: verificación del token, validación del viaje; ¿falta idempotencia, rate limit o `X-Idempotency-Key`?
  3. Express 5: ¿el manejo de errores async es correcto? ¿`express.json({ limit: '10kb' })` y escuchar en `0.0.0.0` tienen riesgo en la red local?
  4. Condiciones de carrera: ¿qué pasa si se toca "Cobrar" dos veces o `verify` corre dos veces a la vez?
  5. ¿`AbortSignal.timeout` en Node 22 y no reintentar el POST son correctos?
  6. ¿Qué caso de prueba falta?
- **Mensaje de aprobación:** "aprobado".

- **Respuesta de Gemini y decisión:**
  - **Se aceptó:** el body de la preferencia, la búsqueda por `external_reference`, los nombres de estados, `requireAuth`, el límite de `10kb`, `0.0.0.0` y `AbortSignal.timeout` sin reintento.
  - **Se corrigió (Gemini dijo que estaba bien):** usar `sandbox_init_point` con tokens `TEST-`. La referencia oficial de "Crear preferencia" dice "Do not use this parameter. For integration testing, use init_point"; ahora se usa siempre `init_point`.
  - **Se modificó (riesgo real, otro arreglo):** dos `verify` a la vez podían dejar el viaje `paid` con `paymentStatus: "pending"`. Gemini propuso llamar a Mercado Pago dentro de una transacción de Firestore; la documentación de Firestore indica que las transacciones en servidor bloquean los documentos que leen y se reintentan, así que el documento quedaría bloqueado hasta 10 s y Mercado Pago se llamaría otra vez; además su código quitaba validaciones. Se consulta Mercado Pago fuera y se escribe con una transacción corta (`updateIfCompleted`) que solo actúa si el viaje sigue `completed`.
  - **Se descartó:** `X-Idempotency-Key` en la preferencia: la referencia de `/checkout/preferences` no lo documenta, y una preferencia de más no causa daño (todas llevan el id del viaje). El doble toque se evita en la app.
  - **Se aceptó con ajuste:** la prueba que faltaba; se agregó "aprobado por otro monto y otro en proceso → pendiente, no aprobado".

- **Verificación:** `npm test` (`node --test`): 9 pruebas pasando. Simulación con Firestore falso: `start` deja `pending`, `verify` aprobado deja `paid`, un `verify` atrasado que ve `pending` no pisa el `paid`, y `start` después de pagado responde 409.

- **Aprendizaje:**
  - Un revisor de IA puede decir "correcto según la documentación" sin que lo sea: se lee la documentación oficial.
  - Una transacción no debe esperar a un servicio externo.

### Entrada #15

- **Fecha:** 12/11/2026
- **Integrante:** Fray Sebastián Benitez
- **Herramientas:** Gemini (Google) para la revisión crítica; Claude (Anthropic) para revisar la respuesta de Gemini.
- **Objetivo:** Revisar el cobro con Mercado Pago en la app (commit `e6a6924`) antes de montarlo: llamada al backend con el token de sesión, apertura del checkout y verificación.

- **Prompt a Gemini (textual, inicio):** "Actúa como revisor de código CRÍTICO de una app React Native (Expo SDK 58, JavaScript, React 19, React Native 0.88, Expo Go en iPhone) que cobra viajes con Mercado Pago Checkout Pro a través de un backend propio. Sustenta cada observación con documentación oficial (Expo, React Native, Firebase JS SDK, MDN, Mercado Pago) y di explícitamente si algo depende de la versión. Si algo está bien, dilo; no propongas cambios por cambiar. Para cada problema da: archivo, línea aproximada, por qué es un problema real y el cambio mínimo." + contexto (rutas del backend, el token de Mercado Pago solo en el backend, sin webhook, decisiones ya tomadas), el código de `api.js`, `paymentRequest.js`, `paymentService.js` y la lógica de `TripSummaryScreen`, y 8 preguntas:
  1. ¿`openBrowserAsync` resuelve al cerrar en iOS y enseguida (`opened`) en Android? ¿Funciona en Expo Go?
  2. ¿El timeout con `AbortController` cancela la petición en Hermes? ¿Problemas con `response.json()` después de un abort?
  3. ¿`getIdToken()` sin `forceRefresh` devuelve un token válido? ¿Es correcto `auth.currentUser`?
  4. ¿La expresión regular de `isValidCheckoutUrl` impide abrir dominios ajenos? ¿Riesgo de enviar el idToken por http en la red local?
  5. ¿Expo Go en iPhone puede hacer `fetch` a `http://192.168.x.x:3000`? ¿Qué cambia en un APK de Android?
  6. ¿`isBusyRef` + `isSending` cubren el doble toque? ¿setState después de desmontar?
  7. ¿Los mensajes y botones dejan reintentar de forma clara?
  8. ¿Qué prueba importante falta?
- **Mensaje de aprobación:** "aprbado".

- **Respuesta de Gemini y decisión:**
  - **Se aceptó:** el comportamiento de `openBrowserAsync` (coincide con la documentación de Expo SDK 58), `AbortController`, `getIdToken()`, `isBusyRef` + `isSending` y los mensajes de reintento.
  - **Se modificó (por otra razón):** Gemini dijo que `https://mercadopago.com.co.evil.com/` pasaba la validación. Se ejecutó la expresión regular con sus ejemplos y todos daban `false`. El problema real era que aceptaba cualquier país (`mercadopago.com.xx`): se restringió a `mercadopago.com` y `mercadopago.com.co`, y se agregaron sus casos de prueba (dominio falso, `@evil.com` y Mercado Pago de otro país).
  - **Se descartó:** `isMountedRef` para "setState en un componente desmontado": React 18 eliminó esa advertencia y abrir el navegador no desmonta la pantalla.
  - **Se descartó:** el "Incorrecto" sobre `response.json()` después de un abort: el abort cae en el `catch` del `fetch` y nunca llega a `.json()` (Gemini lo reconoce en su propia respuesta).
  - **Se descartó:** configurar App Transport Security en `app.json` para usar http: esa configuración no se aplica en Expo Go. La prueba en el iPhone con `http://IP-DEL-PC:3000` funcionó.
  - **Se anotó para la rama del APK (correcto):** Android bloquea el tráfico http en un APK, y el idToken viaja sin cifrar en la red local; en producción se exige https.

- **Verificación:** `npm test`: 91 pruebas pasando (7 de `paymentRequest`). Pagos reales de prueba en el iPhone: aprobado (APRO) y rechazado (OTHE), detallados en la entrada #13.

- **Aprendizaje:**
  - Una afirmación de seguridad se comprueba ejecutando el código con los mismos ejemplos, no solo leyéndola.
  - Lo que aplica a un build propio (`app.json`) no siempre aplica a Expo Go.