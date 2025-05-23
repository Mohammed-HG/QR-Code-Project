import React, { useState, useRef } from "react";
import Mini_NavBar from "../components/Mini_NavBar";
import "../styles/PrimaryPage.css";

import LinkQR from "../components/Link_QRCode";
import TextQR from "../components/Text_QRCode";
import WifiQR from "../components/Wi-Fi_QRCode";
import LocateQR from "../components//Location_QRCode"
import Buttons from "../components/Buttons";
import Customize from "../components/Customize";

const PrimaryPage = () => {
  const [activeService, setActiveService] = useState("linkQR");

  const [text, setText] = useState("");
  const [qrData, setQrData] = useState("");

  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [encryption, setEncryption] = useState("WPA");

  const linkRef = useRef();
  const textRef = useRef();
  const wifiRef = useRef();
  const locateRef = useRef();

  const handleGenerateQR = () => {
    if (activeService === "linkQR" && linkRef.current) {
      linkRef.current.generate();
    }
    if (activeService === "textQR" && textRef.current) {
      textRef.current.generate();
    }
    if (activeService === "wifiQR" && wifiRef.current) {
      wifiRef.current.generate();
    }
    if (activeService === "locateQR" && locateRef.current) {
      locateRef.current.generate();
    }
  };

  const handleDownload = () => {
    if (qrData) {
      const link = document.createElement('a');
      link.href = qrData;
      link.download = `QRCode_${activeService}.png`;
      link.click();
    }
  };

  const isLoading =
    (activeService === "linkQR" && linkRef.current?.loading) ||
    (activeService === "textQR" && textRef.current?.loading) ||
    (activeService === "wifiQR" && wifiRef.current?.loading) ||
    (activeService === "locateQR" && locateRef.current?.loading);

  const disabled =
    (activeService === "linkQR" && linkRef.current?.disabled) ||
    (activeService === "textQR" && textRef.current?.disabled) ||
    (activeService === "wifiQR" && wifiRef.current?.disabled) ||
    (activeService === "locateQR" && locateRef.current?.disabled);

  const renderService = () => {
    switch (activeService) {
      case "linkQR":
        return (
          <LinkQR
            ref={linkRef}
            text={text}
            setText={setText}
            setQrData={setQrData}
          />
        );
      case "textQR":
        return (
          <TextQR
            ref={textRef}
            text={text}
            setText={setText}
            setQrData={setQrData}
          />
        );
      case "wifiQR":
        return (
          <WifiQR
            ref={wifiRef}
            ssid={ssid}
            setSsid={setSsid}
            password={password}
            setPassword={setPassword}
            encryption={encryption}
            setEncryption={setEncryption}
            setQrData={setQrData}
          />
        );
        case "locateQR":
          return (
            <LocateQR 
              ref={locateRef}
              setQrData={setQrData}
            />  
          )
      default:
        return null;
    }
  };

  return (
      <div className="card-1">
      <Mini_NavBar
        activeService={activeService}
        setActiveService={setActiveService}
      />
        <div className="flex-container">
          <div className="left-side">
            {renderService()}
            <br/><br/>
            <h4>Customize QR Code</h4>
            <Customize text={text} setQrData={setQrData} />

          </div>
          <div className="right-side">
            {qrData && (
              <img
                src={qrData}
                alt="QR Code"
                style={{ marginTop: 20, maxWidth: "100%" }}
              />
            )}
            <Buttons
              onGenerate={handleGenerateQR}
              onDownload={handleDownload}
              isLoading={isLoading}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
  );
};

export default PrimaryPage;
