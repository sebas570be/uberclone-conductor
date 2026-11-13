// backend/src/firebaseAdmin.js
// Conexión de ADMINISTRADOR a Firestore. Solo existe en el backend (en el PC):
// con la cuenta de servicio se salta las reglas de seguridad, por eso la app
// nunca usa firebase-admin y la llave nunca sale de esta carpeta.
// AI-assisted: see docs/AI_LOG.md #10
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { CONFIG } = require('./config');

function createAdminDb() {
  if (!CONFIG.serviceAccountPath) {
    throw new Error('Falta FIREBASE_SERVICE_ACCOUNT_PATH en backend/.env (mira backend/.env.example).');
  }
  // La ruta del .env es relativa a la carpeta backend, sin importar desde dónde se ejecute.
  const keyPath = path.resolve(__dirname, '..', CONFIG.serviceAccountPath);
  initializeApp({ credential: cert(keyPath) });
  return getFirestore();
}

const db = createAdminDb();
// Para verificar el token de sesión que manda la app (quién es el conductor).
const auth = getAuth();

module.exports = { db, auth };
