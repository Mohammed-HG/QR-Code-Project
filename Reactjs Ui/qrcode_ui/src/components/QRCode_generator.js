import React, { useState } from 'react';
import axios from 'axios';
import QRCode from 'react-qr-code';
import { useDropzone } from 'react-dropzone';

const QRCode_generator =  () => {
    const [text, setText] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [extractedText, setExtractedText] = useState('');
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
                const response = await axios.post('http://localhost:3000/upload-image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                setExtractedText(response.data.extractedText);
                setQrCode(response.data.qrCode);
              } catch (error) {
                alert('Failed to process image!');
              } finally {
                setIsLoading(false);
              }
            },
        });

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

      {/* رفع الصور */}
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

      {/* عرض النص المستخرج من الصورة */}
      {extractedText && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Extracted Text:</h3>
          <p>{extractedText}</p>
        </div>
      )}

      {/* عرض QR Code */}
      {qrCode && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <h3>Your QR Code:</h3>
          <QRCode value={qrCode} size={200} />
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

export default QRCode_generator;