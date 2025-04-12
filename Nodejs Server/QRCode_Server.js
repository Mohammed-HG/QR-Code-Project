const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql');
const QRCode = require('qrcode');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const cors = require('cors')

const PORT = process.env.PORT || 3200;

app.use(cors());
app.use(express.json());

require('dotenv').config();

// تهيئة Multer لحفظ الملفات في مجلد 'uploads'
const upload = multer({ dest: 'uploads/' });

// Route لرفع صورة واستخراج النص منها
app.post('/upload-image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded!' });
  }

  try {
    // استخراج النص من الصورة باستخدام Tesseract.js
    const { data: { text } } = await Tesseract.recognize(
      req.file.path,
      'eng' // اللغة (الإنجليزية)
    );

    // إنشاء QR Code من النص المستخرج
    const qrImage = await QRCode.toDataURL(text);
    res.json({ extractedText: text, qrCode: qrImage });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process image' });
  }
});

app.post('/generate-qr', async (req, res) => {
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



app.listen(PORT, '0.0.0.0', () =>{
    console.log(`Server is running on port ${PORT}`);
});