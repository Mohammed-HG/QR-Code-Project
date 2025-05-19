import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import MessageModal from './MessageModal';
import '../styles/QRCode_generator.css'
import axios from 'axios';

const Text_QRCode = forwardRef(({ text, setText, setQrData }, ref) => {

  const [qrData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const qrRef = useRef(null);

  const [modalShow, setModalShow] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalFooter, setModalFooter] = useState('');
  const handleClose = () => setModalShow(false);

  const TextToQRCode = async () => {
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
      setModalTitle('Error');
      setModalMessage('Failed to generate QR Code!');
      setModalFooter('error code: 500');
      setModalShow(true);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    generate: TextToQRCode,
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
    <div className='QR_style'>
      <h2>Text to QR Code</h2>

      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Enter Text Here"
        style={{ width: '100%', padding: 10, marginBottom: 10 }}
      />
      
      <MessageModal
        show={modalShow}
        handleClose={handleClose}
        title={modalTitle}
        message={modalMessage}
        footer={modalFooter}
      />

    </div>
  );
});

export default Text_QRCode;
