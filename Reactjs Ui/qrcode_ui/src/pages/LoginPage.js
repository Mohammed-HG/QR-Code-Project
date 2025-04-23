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
  
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [contact, setContact] = useState(''); // email or phone number
  
    const [counter, setCounter] = useState(10);
    const [resendDisabled, setResendDisabled] = useState(true);
  
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const sectionRefs = useRef([]);

    useEffect(() => {
        let timer;
        if (otpSent && counter > 0) {
          timer = setTimeout(() => {
            setCounter(counter - 1);
          }, 1000);
        } else if (counter === 0) {
          setResendDisabled(false);
        }
        return () => clearTimeout(timer);
      }, [otpSent, counter]);

      const handleLogin = async (e) => {
        e.preventDefault();
        
        try {
            const response = await axios.post('http://localhost:3200/api/login', {username, password});

            if (response.data.token) {
                await axios.post('http://localhost:3200/api/send-otp', { contact, type: 'phone' });
                localStorage.setItem('token', response.data.token);
                setOtpSent(true);
                setCounter(10);
                setResendDisabled(true);
                setModalTitle('OTP Sent');
                setModalMessage('An OTP has been sent to your phone number.');
                setModalShow(true);
                setTimeout(() => {
                    handleClose();
                  }, 2000);
              }
            } catch (error) {
              setModalTitle('Login Error');
              setModalMessage('Invalid username or password. Please try again.');
              setModalShow(true);
            }
        };

        const handleVerifyOtp = async (e) => {
            e.preventDefault();
            try {
              const token = localStorage.getItem('token');
              const response = await axios.post('http://localhost:3200/api/verify-otp', { contact, otp }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (response.status === 200) {
                setModalTitle('Login Successful');
                setModalMessage('OTP verified successfully.');
                setModalShow(true);
                setTimeout(() => {
                  handleClose();
                  navigate('/PrimaryPage');
                }, 1000);
              }
            } catch (error) {
              setModalTitle('OTP Verification Error');
              setModalMessage('Invalid OTP. Please try again.');
              setModalShow(true);
            }
          };
        
          const handleResendOtp = async () => {
            try {
              await axios.post('http://lpcalhost:3200/api/send-otp', { contact, type: 'email' });
              setModalTitle('OTP Sent');
              setModalMessage('A new OTP has been sent to your email or phone.');
              setModalShow(true);
              setCounter(10);
              setResendDisabled(true);
              setTimeout(() => {
                handleClose();
              }, 2000);
        
            } catch (error) {
              setModalTitle('Error');
              setModalMessage('Failed to resend OTP. Please try again.');
              setModalShow(true);
            }
          };
        
          const handleAdminClick = () => {
            navigate('/admin');
          }
        
          const handleRegisterClick = () => {
            navigate('/register');
          }

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

                <input
                className="input"
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Verify by email or phone number"
                name="contact"
                required
                />

                {otpSent && (
                <>
                    <div className="input-group">
                    <input
                        className="input"
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter OTP"
                        name="otp"
                        required
                    />
                    <button type="button" className="small-button button" onClick={handleVerifyOtp}>
                        Verify
                    </button>
                    </div>

                    <button
                    type="button"
                    className="resend-button button"
                    onClick={handleResendOtp}
                    disabled={resendDisabled}
                    >
                    {resendDisabled ? `Resend OTP in ${counter}s` : 'Resend OTP'}
                    </button>
                </>
                )}

                {!otpSent && (
                <button type="submit" className="button">
                    Login
                </button>
                )}

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