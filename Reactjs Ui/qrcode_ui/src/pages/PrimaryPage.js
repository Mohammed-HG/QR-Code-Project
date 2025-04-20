import { useState } from "react";
import "../css style/PrimaryPage.css";

import LinkQR from "../components/Link_QRCode";
import ImageQR from "../components/Image_QRCode";
//import OtherService from "../components/OtherService";

const PrimaryPage = () => {
  const [activeService, setActiveService] = useState("link");

  const renderService = () => {
    switch (activeService) {
      case "linkQR":
        return <LinkQR />;
      case "imageQR":
        return <ImageQR />;
      /*case "other":
        return <OtherService />;*/
      default:
        return <div>اختر خدمة لعرض التفاصيل</div>;
    }
  };

  return (
    <div className="services-container">
      <div className="services-tabs">
        <button onClick={() => setActiveService("linkQR")}>Link to QR</button>
        <hr className="hr1-line" />
        <button onClick={() => setActiveService("imageQR")}>Image to QR</button>
        <hr className="hr1-line" />
        <button onClick={() => setActiveService("other")}>الخدمة 3</button>
      </div>
      <hr className="hr-line" />

      <div className="services-content">{renderService()}</div>
    </div>
  );
};

export default PrimaryPage;
