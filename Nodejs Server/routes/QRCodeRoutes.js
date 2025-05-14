const express = require('express');
const QRCode = require('qrcode');
const { Readable } = require('stream');

const router = express.Router();

router.post('/customize-qr', async (req, res) => {
  const { text, dotColor = '#000000', dotShape = 'rounded', bgColor = '#ffffff', size = 300 } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });
  
  // إعدادات التخصيص
  const options = {
      color: {
          dark: dotColor,  // لون النقاط
          light: bgColor   // لون الخلفية
      },
      width: size,
      margin: 2, // تحديد هوامش
  };

  try {
      // توليد QR code
      const qrCodeData = await QRCode.toBuffer(text, options);
      
      // تحويل البوفر إلى stream
      const stream = Readable.from(qrCodeData);
      res.setHeader('Content-Type', 'image/png');
      stream.pipe(res);
  } catch (error) {
      console.error('Error generating QR Code:', error);
      res.status(500).json({ error: 'Failed to generate QR Code' });
  }
});

router.post('/generate-qr', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required!' });
  }

  try {
    // توليد Buffer ثنائي لصورة PNG
    const buffer = await QRCode.toBuffer(text);

    // إرسال البايتات مع رأس المحتوى الصحيح
    res.set('Content-Type', 'image/png');
    res.send(buffer);
  } catch (err) {
    res.status(500).end();
  }
});

router.post('/generate-qr/wifi', async (req, res) => {
  const { ssid, password, encryption } = req.body;

  if (!ssid || !encryption) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

    // بناء نص Wi-Fi بناءً على نوع التشفير
    let wifiData = `WIFI:T:${encryption === 'nopass' ? 'nopass' : 'WPA'};S:${ssid};`;

    if (encryption !== "nopass") {
        wifiData += `P:${password};`;
    }

    wifiData += ";";

    try {
        const buffer = await QRCode.toBuffer(wifiData);
        res.set("Content-Type", "image/png");
        res.send(buffer);
    } catch (err) {
        console.error("Error generating QR code:", err);
        res.status(500).end();
    }
});

router.post('/generate-qr/location', async (req, res) => {
  const { locationData } = req.body;
  if (!locationData) return res.status(400).json({ error: 'Missing required fields' });

  try {
      const buffer = await QRCode.toBuffer(locationData);
      res.set('Content-Type', 'image/png');
      res.send(buffer);
  } catch (err) {
      res.status(500).end();
  }
});

module.exports = router;
