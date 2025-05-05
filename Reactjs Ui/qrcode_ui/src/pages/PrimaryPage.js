import { useState, useRef, useEffect } from "react";
import Mini_NavBar from "../components/Mini_NavBar";
import QRCodeStyling from "qr-code-styling";
import "../styles/PrimaryPage.css";

import LinkQR from "../components/Link_QRCode";
import TextQR from "../components/Text_QRCode";
import WifiQR from "../components/Wi-Fi_QRCode";
import Buttons from "../components/Buttons";
import Customize from "../components/Customize";

const PrimaryPage = () => {
  const [activeService, setActiveService] = useState("link");
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState("");
  const [dotColor, setDotColor] = useState("#000000");
  const [dotShape, setDotShape] = useState("rounded");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [qrSize, setQrSize] = useState(300);
  const qrRef = useRef(null);

  const qrInstance = useRef(
    new QRCodeStyling({
      width: 300,
      height: 300,
      type: "canvas",
      data: "https://example.com",
    })
  ).current;

  const handleDotColor = (color) => {
    setDotColor(color);
  };

  const handleDotShape = (shape) => {
    setDotShape(shape);
  };

  const handleBgColor = (color) => {
    setBgColor(color);
  };

  const handleDownload = () => {
    qrInstance.download({ name: "qr-code", extension: "png" });
  };

  const generateQRFromText = () => {
    qrInstance.update({ data: text });
  };

  const handleSizeChange = (size) => {
    setQrSize(size);
    qrInstance.update({ width: size, height: size });
  };

  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [encryption, setEncryption] = useState("WPA");


  const renderService = () => {
    switch (activeService) {
      case "linkQR":
        return <LinkQR text={text} setText={setText} />;
      case "TextQR":
        return <TextQR text={text} setText={setText} />;
      case "WifiQR":
        return <WifiQR    
                  ssid={ssid}
                  setSsid={setSsid}
                  password={password}
                  setPassword={setPassword}
                  encryption={encryption}
                  setEncryption={setEncryption}
                />;
      default:
        return <LinkQR text={text} setText={setText} />;
    }
  };

  useEffect(() => {
    if (qrRef.current) {
      qrRef.current.innerHTML = "";
      qrInstance.append(qrRef.current);
    }
  }, []);

  useEffect(() => {
    if (qrInstance) {
      qrInstance.update({
        dotsOptions: { color: dotColor, type: dotShape },
        backgroundOptions: { color: bgColor },
      });
    }
  }, [dotColor, dotShape, bgColor, text]);

  return (
    <>
      <Mini_NavBar
        activeService={activeService}
        setActiveService={setActiveService}
      />
      <div className="card-1">
        <div className="flex-container">
          <div className="left-side">
            <div className="services-content">{renderService()}</div>
            
            <Customize
              onChangeDotColor={handleDotColor}
              onChangeDotShape={handleDotShape}
              onChangeBgColor={handleBgColor}
              onChangeSize={handleSizeChange}
            />
          </div>
          
          <div className="right-side">
            <br/>
            <div ref={qrRef} style={{ marginBottom: "20px" }} />

            <Buttons
              onGenerate={generateQRFromText}
              onDownload={handleDownload}
              isLoading={isLoading}
              disabled={!ssid || (!password && encryption !== "nopass")}
              generateText="Generate QR Wi-Fi"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default PrimaryPage;
