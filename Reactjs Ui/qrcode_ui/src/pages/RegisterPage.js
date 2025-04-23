import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MessageModal from '../components/MessageModal';
import gsap from "gsap";
import Lottie from "lottie-react";
import '../styles/LoginAndRegister.css'

import QRCodeAnimation from '../animations/QRCodes.json';

const features = [
    {
      animation: QRCodeAnimation,
    },
  ]

const RegisterPage = () => {
    
  const [modalShow, setModalShow] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const handleClose = () => setModalShow(false);
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const [counter, setCounter] = useState(10);
  const [resendDisabled, setResendDisabled] = useState(true);

  const sectionRefs = useRef([]);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3200/api/register', { username, password, email });
        setModalTitle('Register Successful');
        setModalMessage('You Have Account Now!, you can Login ');
        setModalShow(true);
        setTimeout(() => {
          handleClose();
          navigate('/login');
        }, 1000);
    } catch (error) {
      setModalTitle('Registration Error');
      setModalMessage('There was an error during registration. Please try again.');
      setModalShow(true);
    }
  };

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

  return (
    <div className="container">
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
        <form onSubmit={handleRegister} className="form was-validated">
        <h2 className="title">Register</h2>

        <input
            className='input'
          type="text"
          placeholder="Set New Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

            <input
                className="input"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                name="email"
                required
            />

        <input
          className='input'
          type="password"
          placeholder="Set New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

                <button type="submit" className="button">
                    Register
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

export default RegisterPage;