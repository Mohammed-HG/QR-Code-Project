import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar, Nav, NavDropdown, Container } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faUser, faInfoCircle, faSignOutAlt, faSignInAlt, faUserPlus, faClipboard, faBars} from '@fortawesome/free-solid-svg-icons';
import MessageModal from "../components/MessageModal";
import '../styles/NavBar.css'

import QRCode from '../animations/qrcode(4).png'

const NavBar = () => {
  const navigate = useNavigate();
  const [modalShow, setModalShow] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token) {
      setIsLoggedIn(true);
      setUsername(user || 'User');
    }
  }, []);

  const handleLogoutClick = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setModalTitle('Logged out');
    setModalMessage('You have been logged out successfully.');
    setModalShow(true);
    setTimeout(() => {
      setModalShow(false);
      navigate('/login');
    }, 1500);
  };

  return (
    <>
      <Navbar bg="dark" variant="dark" expand={false}>
        <Container>
          <Navbar.Brand onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img className="img-1" src={QRCode} />
          <hr />
          QR Code Project
          </Navbar.Brand>

          <Nav className="ms-auto">
            <NavDropdown
              title={<FontAwesomeIcon icon={faBars} size="lg" />}
              id="nav-dropdown"
              align="end"
              menuVariant="dark"
            >
              {isLoggedIn ? (
                <>
                  <NavDropdown.Item onClick={() => navigate('/account')}>
                    <FontAwesomeIcon icon={faUser} className="me-2" />
                    Account
                  </NavDropdown.Item>
                  <NavDropdown.Item onClick={() => navigate('/saved-qrcodes')}>
                    <FontAwesomeIcon icon={faClipboard} className="me-2" />
                    Saved QR Codes
                  </NavDropdown.Item>
                  <NavDropdown.Item onClick={() => navigate('/about')}>
                    <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                    About
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogoutClick} className="text-danger">
                    <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
                    Logout
                  </NavDropdown.Item>
                </>
              ) : (
                <>
                  <NavDropdown.Item onClick={() => navigate('/login')}>
                    <FontAwesomeIcon icon={faSignInAlt} className="me-2" />
                    Login
                  </NavDropdown.Item>
                  <NavDropdown.Item onClick={() => navigate('/register')}>
                    <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                    Register
                  </NavDropdown.Item>
                  <NavDropdown.Item onClick={() => navigate('/about')}>
                    <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                    About
                  </NavDropdown.Item>
                </>
              )}
            </NavDropdown>
          </Nav>
        </Container>
      </Navbar>

      <MessageModal
        show={modalShow}
        handleClose={() => setModalShow(false)}
        title={modalTitle}
        message={modalMessage}
      />
    </>
  );
};

export default NavBar;
