// backend/src/middleware/requireAuth.js
// Solo atiende a conductores con sesión: la app manda su token de Firebase
// (Authorization: Bearer <idToken>) y aquí se verifica con firebase-admin.
// Si es válido, req.uid = el conductor que hace la petición.
const { auth } = require('../firebaseAdmin');

async function requireAuth(req, res, next) {
  const header = req.get('Authorization') ?? '';
  const [scheme, idToken] = header.split(' ');
  if (scheme !== 'Bearer' || !idToken) {
    return res.status(401).json({ error: 'Falta la sesión.' });
  }
  try {
    const decoded = await auth.verifyIdToken(idToken);
    req.uid = decoded.uid;
    return next();
  } catch {
    // Token vencido, falso o de otro proyecto.
    return res.status(401).json({ error: 'Sesión inválida o vencida.' });
  }
}

module.exports = { requireAuth };
