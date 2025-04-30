import { useState, useRef, useEffect } from "react";
import Mini_NavBar from "../components/Mini_NavBar";
import QRCodeStyling from "qr-code-styling";
import "../styles/PrimaryPage.css";

import LinkQR from "../components/Link_QRCode";
import ImageQR from "../components/Image_QRCode";
import Buttons from "../components/Buttons";
import Customize from "../components/Customize";

const qrInstance = new QRCodeStyling({
  width: 300,
  height: 300,
  type: "canvas",
  data: "https://example.com",
});

const PrimaryPage = () => {
  const [activeService, setActiveService] = useState("link");
  const qrRef = useRef(null);

  const renderService = () => {
    switch (activeService) {
      case "linkQR":
        return <LinkQR />;
      case "imageQR":
        return <ImageQR />;
      default:
        return <div>Choose Services !</div>;
    }
  };

  useEffect(() => {
    if (qrRef.current) {
      qrRef.current.innerHTML = "";
      qrInstance.append(qrRef.current);
    }
  }, []);

  const handleChangeColor = (e) => {
    qrInstance.update({ dotsOptions: { color: e.target.value } });
  };

  const handleChangeType = (e) => {
    qrInstance.update({ dotsOptions: { type: e.target.value } });
  };

  const handleDownload = () => {
    qrInstance.download({ name: "qr-code", extension: "png" });
  };

  return (
    <>
      <Mini_NavBar
        activeService={activeService}
        setActiveService={setActiveService}
      />
      <div className="flex-container">
        <div className="left-side">
          <div className="services-content">{renderService()}</div>
        </div>

        <div className="right-side">
          <div ref={qrRef} style={{ marginBottom: "20px" }} />
          <Customize
            onChangeColor={handleChangeColor}
            onChangeType={handleChangeType}
          />
          <Buttons onDownload={handleDownload} />
        </div>
      </div>
    </>
  );
};
export default PrimaryPage;
