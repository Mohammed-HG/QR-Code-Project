import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MessageModal from '../components/MessageModal';
import gsap from "gsap";
import Lottie from "lottie-react";
import '../styles/LoginAndRegister.css';

import QRCodeAnimation from '../animations/QRCodes.json';

const features = [{ animation: QRCodeAnimation }];

const RegisterPage = () => {
  const [modalShow, setModalShow] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const handleClose = () => setModalShow(false);
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [counter, setCounter] = useState(10);
  const [resendDisabled, setResendDisabled] = useState(true);

  const sectionRefs = useRef([]);

  useEffect(() => {
    let timer;
    if (otpSent && counter > 0) {
      timer = setTimeout(() => {
        setCounter(prev => prev - 1);
      }, 1000);
    } else if (counter === 0) {
      setResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [otpSent, counter]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3200/api/send-otp', { contact: email, type: 'email' });
      setOtpSent(true);
      setCounter(10);
      setResendDisabled(true);
      setModalTitle('OTP Sent');
      setModalMessage('An OTP has been sent to your email.');
      setModalShow(true);
    } catch (error) {
      setModalTitle('Error Sending OTP');
      setModalMessage('Failed to send OTP. Please check the email and try again.');
      setModalShow(true);
    }
  };

  const handleResendOtp = async () => {
    try {
      await axios.post('http://localhost:3200/api/send-otp', { contact: email, type: 'email' });
      setCounter(10);
      setResendDisabled(true);
      setModalTitle('OTP Resent');
      setModalMessage('A new OTP has been sent to your email.');
      setModalShow(true);
    } catch (error) {
      setModalTitle('Error');
      setModalMessage('Could not resend OTP. Please try again.');
      setModalShow(true);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3200/api/verify-otp', { contact: email, otp });
      if (response.status === 200) {
        await axios.post('http://localhost:3200/api/register', { username, password, email });
        setModalTitle('Registration Complete');
        setModalMessage('Account created successfully!');
        setModalShow(true);
        setTimeout(() => {
          handleClose();
          navigate('/login');
        }, 1500);
      }
    } catch (error) {
      setModalTitle('OTP Verification Failed');
      setModalMessage('Invalid OTP. Please try again.');
      setModalShow(true);
    }
  };

  useEffect(() => {
    sectionRefs.current.forEach((el) => {
      const content = el.querySelector(".feature-content");
      if (content) {
        gsap.fromTo(content, { opacity: 0, y: 300 });
      }
    });
  }, []);

  return (
    <div className="container">
      {features.map((feature, idx) => (
        <div key={idx} ref={(el) => el && (sectionRefs.current[idx] = el)}>
          {feature.animation && (
            <div className="background-animation">
              <Lottie animationData={feature.animation} loop={true} />
            </div>
          )}
          <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="form was-validated">
            <h2 className="title">Register</h2>

            <input
              className='input'
              type="text"
              placeholder="Set New Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={otpSent}
            />

            <input
              className="input"
              type="text"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={otpSent}
            />

            <input
              className='input'
              type="password"
              placeholder="Set New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={otpSent}
            />

            {otpSent && (
              <>
                <input
                  className='input'
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="small-button button"
                  onClick={handleResendOtp}
                  disabled={resendDisabled}
                >
                  {resendDisabled ? `Resend OTP in ${counter}s` : 'Resend OTP'}
                </button>
              </>
            )}

            <button type="submit" className="button">
              {otpSent ? 'Verify OTP' : 'Register'}
            </button>

            <MessageModal
              show={modalShow}
              handleClose={handleClose}
              title={modalTitle}
              message={modalMessage}
            />
          </form>
        </div>
      ))}
    </div>
  );
};

export default RegisterPage;
