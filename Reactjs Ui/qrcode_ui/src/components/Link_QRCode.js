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
      const response = await axios.post('http://localhost:3200/qr/generate-qr', { text });
      setQrData(text);

      qrInstance.update({
        data: text,
      });
    } catch (error) {
      alert('Failed to generate QR Code!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (qrData && qrRef.current) {
      qrRef.current.innerHTML = ''; // عشان ما تتكرر
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

          {/* أدوات التصميم */}
          <div style={{ marginTop: '20px' }}>
            <label>لون النقاط:</label>
            <input
              type="color"
              onChange={(e) => qrInstance.update({ dotsOptions: { color: e.target.value } })}
            />

            <label style={{ marginLeft: '10px' }}>شكل النقاط:</label>
            <select
              onChange={(e) => qrInstance.update({ dotsOptions: { type: e.target.value } })}
            >
              <option value="rounded">Rounded</option>
              <option value="dots">Dots</option>
              <option value="square">Square</option>
            </select>

            <div style={{ marginTop: '20px' }}>
              <button
                onClick={() => qrInstance.download({ name: 'qr-code', extension: 'png' })}
                style={{ padding: '10px 20px', background: '#007bff', color: 'white' }}
              >
                Download QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Link_QRCode;
