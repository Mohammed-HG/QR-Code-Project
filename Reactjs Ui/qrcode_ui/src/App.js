import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PrimaryPage from './pages/PrimaryPage';
import Link_GRCode from './components/Link_QRCode';
import Image_QRCode from './components/Image_QRCode';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path='/PrimaryPage' element={<PrimaryPage />} />
        <Route path='/Link_GRCode' element={<Link_GRCode />} />
        <Route path='/Image_QRCode' element={<Image_QRCode />} />
      </Routes>
    </Router>
  );
}

export default App;