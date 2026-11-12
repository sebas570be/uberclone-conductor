// backend/src/routes/payments.js
// Rutas de pagos (API REST). Todas exigen sesión (requireAuth).
//   POST /api/payments/start   { tripId } → { checkoutUrl }
//   POST /api/payments/verify  { tripId } → { paymentStatus }
const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { HttpError, startPayment, verifyPayment } = require('../services/tripPaymentService');

const router = express.Router();
router.use(requireAuth);

// Convierte los errores en respuestas: los esperados con su código y su
// mensaje; los inesperados como 502/500 sin detalles internos.
function handle(action) {
  return async (req, res) => {
    try {
      res.json(await action(req.body?.tripId, req.uid));
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ error: error.message });
      }
      console.error('Error en pagos:', error.message);
      const isMercadoPago = error.message?.startsWith('Mercado Pago');
      return res
        .status(isMercadoPago ? 502 : 500)
        .json({ error: isMercadoPago ? 'Mercado Pago no respondió. Inténtalo de nuevo.' : 'Error del servidor.' });
    }
  };
}

router.post('/start', handle(startPayment));
router.post('/verify', handle(verifyPayment));

module.exports = { paymentsRouter: router };
