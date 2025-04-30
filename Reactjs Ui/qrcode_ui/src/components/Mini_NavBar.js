import React from "react";
import { Navbar, Nav, Container } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink, faImage } from '@fortawesome/free-solid-svg-icons';
import '../styles/NavBar.css';

const Mini_NavBar = ({ activeService, setActiveService }) => {
  return (
    <Navbar bg="dark" variant="dark" expand={false}>
      <Container>
          <Nav className="flex-row">
          <button 
            className={`tab-btn ${activeService === "linkQR" ? "active" : ""}`} 
            onClick={() => setActiveService("linkQR")}
          >
            <FontAwesomeIcon icon={faLink} /> Link to QR
          </button>

          <button 
            className={`tab-btn ${activeService === "imageQR" ? "active" : ""}`}
            onClick={() => setActiveService("imageQR")}
          >
            <FontAwesomeIcon icon={faImage} /> Image to QR
          </button>

          <button 
            className={`tab-btn ${activeService === "other" ? "active" : ""}`}
            onClick={() => setActiveService("other")}
          >
            Other
          </button>
        </Nav>
      </Container>
    </Navbar>
  );
};

export default Mini_NavBar;
