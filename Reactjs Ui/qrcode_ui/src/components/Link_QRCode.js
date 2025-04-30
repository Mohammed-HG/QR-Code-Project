import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import QRCodeStyling from 'qr-code-styling';

const qrInstance = new QRCodeStyling({
  width: 300,
  height: 300,
  type: 'canvas',
  data: '',
  image: '',
  dotsOptions: {
    color: '#000000',
    type: 'rounded'
  },
  backgroundOptions: {
    color: '#ffffff',
  },
  imageOptions: {
    crossOrigin: "anonymous",
    margin: 10,
  },
});

const Link_QRCode = () => {
  const [text, setText] = useState('');
  const [qrData, setQrData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const qrRef = useRef(null);

  const generateQRFromText = async () => {
    try {
      setIsLoading(true);
      await axios.post('http://localhost:3200/qr/generate-qr', { text });
      setQrData(text);
      qrInstance.update({ data: text });
    } catch (error) {
      alert('Failed to generate QR Code!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (qrData && qrRef.current) {
      qrRef.current.innerHTML = ''; // لمنع التكرار
      qrInstance.append(qrRef.current);
    }
  }, [qrData]);

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>QR Code Generator</h1>

      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text or URL"
        style={{ padding: '10px', width: '100%' }}
      />
      <button
        onClick={generateQRFromText}
        disabled={!text || isLoading}
        style={{ marginTop: '10px', padding: '10px 20px' }}
      >
        {isLoading ? 'Generating...' : 'Generate QR'}
      </button>

      {qrData && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <h3>Your QR Code:</h3>
          <div ref={qrRef} />

        </div>
      )}
    </div>
  );
};

export default Link_QRCode;
