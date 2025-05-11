import React from "react";
import { Navbar, Nav, Container } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink, faImage, faWifi, faTextHeight, faFileText } from '@fortawesome/free-solid-svg-icons';
import '../styles/NavBar.css';

const Mini_NavBar = ({ activeService, setActiveService }) => {
  return (
    <Navbar variant="dark" expand={false}>
      <Container>
          <Nav className="flex-row">
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
        </Nav>
      </Container>
    </Navbar>
  );
};

export default Mini_NavBar;
