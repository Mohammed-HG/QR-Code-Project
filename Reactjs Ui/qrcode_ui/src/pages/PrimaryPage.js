import { useState } from "react";
import { faLink, faImage, faRocket } from "@fortawesome/free-solid-svg-icons";
import "../styles/PrimaryPage.css";

import LinkQR from "../components/Link_QRCode";
import ImageQR from "../components/Image_QRCode";
import Mini_NavBar from "../components/Mini_NavBar";
//import OtherService from "../components/OtherService";
import QRCode from '../animations/qrcode(4).png';

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
        return <div>Choose Services !</div>;
    }
  };

  return (
    <>
      <Mini_NavBar
        activeService={activeService}
        setActiveService={setActiveService} 
      />
      <div className="flex-container">
        <div className="left-side">
          <div className="services-content fade-in">{renderService()}</div>
        </div>

        <div className="right-side">
          <div>
            <img className="img-2" src={QRCode} />
          </div>
        </div>
      </div>
    </>
  );
};

export default PrimaryPage;
