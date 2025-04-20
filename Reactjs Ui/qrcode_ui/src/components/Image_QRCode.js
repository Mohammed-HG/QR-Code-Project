import React, { useState } from 'react';
import axios from 'axios';
import QRCode from 'qrcode';
import { useDropzone } from 'react-dropzone';

const Image_QRCode = () => {
  const [qrCode, setQrCode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { getRootProps, getInputProps } = useDropzone({
    accept: 'image/*',
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];
      const formData = new FormData();
      formData.append('image', file);

      try {
        setIsLoading(true);
        const response = await axios.post('http://localhost:3200/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        // نفترض إن السيرفر يرجع رابط الصورة أو محتوى يُستخدم كـ value للـ QR
        setQrCode(response.data.qrCode);
      } catch (error) {
        alert('Failed to generate QR code from image!');
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Generate QR Code from Image</h1>

      {/* رفع الصورة */}
      <div {...getRootProps()} style={{
        border: '2px dashed #ccc',
        padding: '20px',
        textAlign: 'center',
        marginBottom: '20px',
        cursor: 'pointer'
      }}>
        <input {...getInputProps()} />
        <p>Drag & drop an image here, or click to select</p>
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

      {isLoading && <p style={{ textAlign: 'center' }}>Generating QR Code...</p>}
    </div>
  );
};

export default Image_QRCode;
