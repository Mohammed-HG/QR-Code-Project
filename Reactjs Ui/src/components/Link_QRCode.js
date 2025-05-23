import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import MessageModal from './MessageModal';
import '../styles/QRCode_generator.css'
import axios from 'axios';

const Link_QRCode = forwardRef(({ text, setText, setQrData }, ref) => {

  const apiUrl = process.env.REACT_APP_API_URL;

  const [qrData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const qrRef = useRef(null);

  const [modalShow, setModalShow] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalFooter, setModalFooter] = useState('');
  const handleClose = () => setModalShow(false);

  const generateQRFromText = async () => {
    if (!text) return;
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${apiUrl}/qr/generate-qr`,
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
    <div className='QR_style'>
      <h2>Link to QR Code</h2>

      <input
        type="text"
        value={text}
        onChange={(e) => {
          const value = e.target.value;
          const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/;
          if (value === '' || urlPattern.test(value)) {
            setText(value);
          } else {
            setModalTitle("URL only")
            setModalMessage("You can paste url here only")
            setModalShow(true);
          }
        }}
        placeholder="Enter URL only"
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

export default Link_QRCode;
