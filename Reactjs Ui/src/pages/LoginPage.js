import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MessageModal from '../components/MessageModal';
import gsap from "gsap";
import Lottie from "lottie-react";
import '../styles/LoginAndRegister.css';

import QRCodeAnimation from '../animations/QRCodes.json';

const features = [
  {
    animation: QRCodeAnimation,
  },
]

const LoginPage = () => {

    const [modalShow, setModalShow] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');
  
    const handleClose = () => setModalShow(false);
    const navigate = useNavigate();
      
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const sectionRefs = useRef([]);     

            useEffect(() => {
              sectionRefs.current.forEach((el) => {
                const content = el.querySelector(".feature-content");
                if (content) {
                  gsap.fromTo(
                    content,
                    { opacity: 0, y: 300 },
                  );
                }
              });
            }, []);

      const handleLogin = async (e) => {
        e.preventDefault();
        
        try {
            const response = await axios.post('http://localhost:3200/api/login', {username, password});

            if (response.status === 200) {
              setModalTitle('Login Successful');
              setModalMessage('(:');
              setModalShow(true);
              setTimeout(() => {
                handleClose();
                navigate('/PrimaryPage');
              }, 1000);
            }

            } catch (error) {
              setModalTitle('Login Error');
              setModalMessage('Invalid username or password. Please try again.');
              setModalShow(true);
            }
        };
        
          const handleAdminClick = () => {
            navigate('/admin');
          }
        
          const handleRegisterClick = () => {
            navigate('/register');
          }


        
          return (
            <div className="Login-container">
                {features.map((feature, idx) => (
                <div
                key={idx}
                ref={(el) => el && (sectionRefs.current[idx] = el)}
                >

                      {/* خلفية الأنيميشن */}
                      {feature.animation && (
                        <div className="background-animation">
                          <Lottie animationData={feature.animation} loop={true} />
                        </div>
                      )}
            <form onSubmit={handleLogin} className="form was-validated">
                <h2 className="title">Welcome Back</h2>
                
                <input
                className="input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                name="uname"
                required
                />

                <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                name="pswd"
                required
                />

                <button type="submit" className="button">
                    Login
                </button>

                <h5 style={{ marginTop: '20px' }}>Don't Have Account?</h5>
                <button type="button" className="small-button button" onClick={handleRegisterClick}>
                Register Now!
                </button>

                <MessageModal
                show={modalShow}
                handleClose={handleClose}
                title={modalTitle}
                message={modalMessage}
                />
            </form>
            </div>
          ))};
          </div>
          );
        };
        
        export default LoginPage;