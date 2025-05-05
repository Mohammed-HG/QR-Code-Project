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

const Text_QRCode = ({ text, setText }) => {

    const [qrData, setQrData] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const qrRef = useRef(null)

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
    <div>
      <h1>Enter Text:</h1> 
      <div className='br'>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text"
        style={{ padding: '10px', width: '100%' }}
      />
      </div>
    </div>
  );
};

export default Text_QRCode;
