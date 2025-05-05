import React, { useState, useRef, useEffect } from "react";
import axios from "axios";



const Wifi_QRCode = () => {

    const [ssid, setSsid] = useState("");
    const [password, setPassword] = useState("");
    const [encryption, setEncryption] = useState("WPA");
    const [isLoading, setIsLoading] = useState(false);

    const handleQRtoWifi = async () => {
        try {
          setIsLoading(true);
          const response = await axios.post('http://localhost:3200/qr/generate-qr/wifi', {
            ssid,
            password,
            encryption
          }, {
            responseType: 'blob'  // عشان تستلم صورة
          });

          const blob = response.data;
          const imageUrl = URL.createObjectURL(blob);
          // هنا تقدر تعرض الصورة مثل <img src={imageUrl} />
          console.log("QR Image URL:", imageUrl);
        } catch (err) {
          console.error("Error generating Wi-Fi QR:", err);
        } finally {
          setIsLoading(false);
        }
      };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h2>Wi-Fi QR Code Generator</h2>

            <input 
                type="text"
                placeholder="SSID"
                value={ssid}
                onChange={(e) => setSsid(e.target.value)}
            />

            <input 
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            
            <select
                value={encryption}
                onChange={(e) => setEncryption(e.target.value)}
            >
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">No Password</option>
            </select>
        </div>
    )
}

export default Wifi_QRCode;