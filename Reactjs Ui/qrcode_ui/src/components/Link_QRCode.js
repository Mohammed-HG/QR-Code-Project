import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';

const Link_QRCode = forwardRef(({ text, setText, setQrData }, ref) => {

  const [qrData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const qrRef = useRef(null);

  const generateQRFromText = async () => {
    if (!text) return;
    try {
      setIsLoading(true);
      const response = await axios.post(
        'http://localhost:3200/qr/generate-qr',
        { text },
        { responseType: 'blob' }
      );
      const blob = response.data;
      const imageUrl = URL.createObjectURL(blob);
      setQrData(imageUrl);
    } catch (err) {
      alert('Failed to generate QR Code!');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    generate: generateQRFromText,
    loading: isLoading,
    disabled: !text,
    download: () => {
      if (!qrData) return;
      const a = document.createElement('a');
      a.href = qrData;
      a.download = 'qr-code.png';
      a.click();
    }
  }), [text, isLoading, qrData]);
  
    // مجرد عرض الصورة
    useEffect(() => {
      if (qrData && qrRef.current) {
        qrRef.current.innerHTML = '';
        const img = document.createElement('img');
        img.src = qrData;
        qrRef.current.appendChild(img);
      }
    }, [qrData]);

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
      <h2>Link to QR Code</h2>

      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Enter URL"
        style={{ width: '100%', padding: 10, marginBottom: 10 }}
      />
      
    </div>
  );
});

export default Link_QRCode;
