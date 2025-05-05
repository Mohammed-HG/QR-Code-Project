import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PrimaryPage from './pages/PrimaryPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Link_GRCode from './components/Link_QRCode';
import Text_QRCode from './components/Text_QRCode';
import NavBar from './components/NavBar';
import MessageModal from './components/MessageModal';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path='/PrimaryPage' element={<PrimaryPage />} />
        <Route path='/Login' element={<LoginPage />} />
        <Route path='/Register' element={<RegisterPage />} />
        <Route path='/Link_GRCode' element={<Link_GRCode />} />
        <Route path='/Text_QRCode' element={<Text_QRCode />} />
      </Routes>
    </Router>
  );
}

export default App;