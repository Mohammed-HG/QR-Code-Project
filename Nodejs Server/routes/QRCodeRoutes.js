const express = require('express');
const QRCode = require('qrcode');

const router = express.Router();

router.post('/generate-qr', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required!' });
  }

  try {
    const qrImage = await QRCode.toDataURL(text);
    res.json({ qrCode: qrImage });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate QR Code' });
  }
});

router.post('/generate-qr/wifi', async (req, res) => {
  const { ssid, password, encryption } = req.body;

  if (!ssid || !encryption) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const wifiData = `WIFI:T:${encryption};S:${ssid};P:${password};;`;

  try {
    const qrImage = await QRCode.toDataURL(wifiData);
    res.json({ qrCode: qrImage });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR Code' });
  }
});

module.exports = router;
