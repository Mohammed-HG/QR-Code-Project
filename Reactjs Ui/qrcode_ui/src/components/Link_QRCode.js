import React, { useState } from 'react';
import axios from 'axios';
import QRCode from 'qrcode';

const Link_QRCode =  () => {
    const [text, setText] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [isLoading, setIsLoading] = useState('');

    const generateQRFromText = async () => {
        try {
            setIsLoading(true);
            const response = await axios.post('http://localhost:3200/generate-qr', { text });
            setQrCode(response.data.qrCode);
        } catch (error) {
            alert('Failed to generate QR Code!');
        } finally {
            setIsLoading(false);
        }
    };



  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>QR Code Generator</h1>
      
      {/* إدخال النص */}
      <div style={{ marginBottom: '20px' }}>
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
      </div>



      {/* عرض QR Code */}
      {qrCode && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <h3>Your QR Code:</h3>
          <img src={qrCode} alt="QR Code" style={{ width: '200px', height: '200px' }} />
          <div style={{ marginTop: '10px' }}>
            <a 
              href={qrCode} 
              download="qrcode.png"
              style={{ padding: '10px 20px', background: '#007bff', color: 'white', textDecoration: 'none' }}
            >
              Download QR
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Link_QRCode;