import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import MessageModal from './MessageModal';
import '../styles/QRCode_generator.css'
import axios from 'axios';

const Wifi_QRCode = forwardRef(({ ssid, setSsid, password, setPassword, encryption, setEncryption, setQrData }, ref) => {

  const apiUrl = process.env.REACT_APP_API_URL;
  
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [qrData] = useState('');
    const qrRef = useRef();

    const [modalShow, setModalShow] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const [modalFooter, setModalFooter] = useState(''); 
    const handleClose = () => setModalShow(false);

    const generateWifiQR = async () => {
        if (!ssid || (encryption !== 'nopass' && !password)) return;
        try {
            setIsLoading(true);
            const response = await axios.post(
                `${apiUrl}/qr/generate-qr/wifi`,
                { ssid, password, encryption },
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
      generate: generateWifiQR,
        loading: isLoading,
        disabled: !ssid || (encryption !== 'nopass' && !password),
        download: () => {
            if (!qrRef.current) return;
            const a = document.createElement('a');
            a.href = qrRef.current.src;
            a.download = 'wifi-qr-code.png';
            a.click();
        }
      }), [qrData, isLoading, ssid, password, encryption]);

    useEffect(() => {
        if (qrRef.current) {
            qrRef.current.src = qrRef.current.src;
        }
    }, [qrRef, setQrData]);

    return (
      <div className='QR_style'>
        <h2>Wi-Fi QR Code</h2>

          <input
              type="text"
              placeholder="SSID"
              value={ssid}
              onChange={e => setSsid(e.target.value)}
              style={{ width: '100%', padding: 10, marginBottom: 10 }}
          />

        {encryption !== "nopass" && (
          <div style={{ position: "relative", width: "100%", marginBottom: 10 }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 40px 10px 10px", // ترك مساحة للأيقونة
                boxSizing: "border-box", // لضمان أن padding لا يؤثر على العرض
          }}/>

            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
              }}
            >
              {showPassword ? <FontAwesomeIcon icon={faEyeSlash} /> : <FontAwesomeIcon icon={faEye} />} {/* رمز العين للكشف عن الباسوورد */}
            </span>
          </div>
        )}

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: 10,
              top: 10,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 16,
            }}>
          </button>

          <select
            value={encryption}
            onChange={e => setEncryption(e.target.value)}
            style={{ width: '100%', padding: 10, marginBottom: 10 }}
          >
            <option value="WPA">WPA/WPA2-Personal</option>
            <option value="WEP">WEP</option>
            <option value="nopass">No Password</option>
          </select>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
      </div>

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

export default Wifi_QRCode;
