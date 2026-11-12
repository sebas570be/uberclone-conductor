// backend/src/server.js
// Servidor de pagos (Node + Express, enunciado G3). Se ejecuta en el PC con
// npm start; el iPhone le habla por la red Wi-Fi local.
const express = require('express');
const { CONFIG } = require('./config');
const { paymentsRouter } = require('./routes/payments');

const app = express();
app.use(express.json({ limit: '10kb' })); // los pedidos son pequeños

// Para comprobar desde el navegador o el celular que el servidor responde.
app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api/payments', paymentsRouter);

app.listen(CONFIG.port, CONFIG.host, () => {
  console.log(`Servidor de pagos escuchando en el puerto ${CONFIG.port}`);
  if (!CONFIG.mercadoPagoAccessToken) {
    console.warn('Aviso: falta MP_ACCESS_TOKEN en backend/.env; los cobros por Mercado Pago van a fallar.');
  }
});
