import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import QRCode_generator from './components/QRCode_generator';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path='/GRCode_Generator' element={<QRCode_generator />} />
      </Routes>
    </Router>
  );
}

export default App;