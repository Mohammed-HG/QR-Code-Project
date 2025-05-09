import React, { useState } from 'react';
import axios from 'axios';

const Wifi_QRCode = ({
  ssid, setSsid,
  password, setPassword,
  encryption, setEncryption
}) => {
  const [qrData, setQrData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateWifiQR = async () => {
    if (!ssid || (encryption !== 'nopass' && !password)) return;
    try {
      setIsLoading(true);
      const response = await axios.post(
        'http://localhost:3200/qr/generate-qr/wifi',
        { ssid, password, encryption },
        { responseType: 'blob' }
      );
      const blob = response.data;
      setQrData(URL.createObjectURL(blob));
    } catch (err) {
      alert('Failed to generate Wi-Fi QR!');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
      <h2>Wi-Fi QR Code</h2>

      <input
        type="text"
        placeholder="SSID"
        value={ssid}
        onChange={e => setSsid(e.target.value)}
        style={{ width: '100%', padding: 10, marginBottom: 10 }}
      />

      {encryption !== 'nopass' && (
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: 10, marginBottom: 10 }}
        />
      )}

      <select
        value={encryption}
        onChange={e => setEncryption(e.target.value)}
        style={{ width: '100%', padding: 10, marginBottom: 10 }}
      >
        <option value="WPA">WPA/WPA2</option>
        <option value="WEP">WEP</option>
        <option value="nopass">No Password</option>
      </select>

      <button
        onClick={generateWifiQR}
        disabled={
          isLoading ||
          !ssid ||
          (encryption !== 'nopass' && !password)
        }
      >
        {isLoading ? 'Generating…' : 'Generate Wi-Fi QR'}
      </button>

      {qrData && (
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <img src={qrData} alt="Wi-Fi QR Code" style={{ maxWidth: '100%' }} />
        </div>
      )}
    </div>
  );
};

export default Wifi_QRCode;
