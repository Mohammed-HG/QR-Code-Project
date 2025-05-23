import React from "react";
import { Navbar, Nav, Container } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink, faWifi, faFileText, faLocation } from '@fortawesome/free-solid-svg-icons';
import '../styles/NavBar.css';

const Mini_NavBar = ({ activeService, setActiveService }) => {
  return (
    <Navbar variant="dark" expand={false}>
      <Container>
        <Nav className="flex-row">
          <div className="buttons-container">
            <button 
              className={`tab-btn ${activeService === "linkQR" ? "active" : ""}`} 
              onClick={() => setActiveService("linkQR")}
            >
              <FontAwesomeIcon icon={faLink} /> URL
            </button>

            <button 
              className={`tab-btn ${activeService === "TextQR" ? "active" : ""}`}
              onClick={() => setActiveService("textQR")}
            >
              <FontAwesomeIcon icon={faFileText} /> Text
            </button>

            <button 
              className={`tab-btn ${activeService === "Wi-WifiQR" ? "active" : ""}`}
              onClick={() => setActiveService("wifiQR")}
            >
              <FontAwesomeIcon icon={faWifi} /> Wi-Fi
            </button>

            <button 
              className={`tab-btn ${activeService === "LocateQR" ? "active" : ""}`}
              onClick={() => setActiveService("locateQR")}
            >
              <FontAwesomeIcon icon={faLocation} /> Location
            </button>
          </div>
        </Nav>
      </Container>
    </Navbar>
  );
};

export default Mini_NavBar;
