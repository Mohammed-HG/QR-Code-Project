import React from "react";
import '../styles/Customize.css'

const Customize = ({ onChangeDotColor, onChangeDotShape, onChangeBgColor, onChangeSize }) => {
  if (!onChangeDotColor || !onChangeDotShape || !onChangeBgColor || !onChangeSize) return null;

  return (
    <div className="customize-container">
      <div className="customize-card">
        <label>Dot Color</label>
        <input
          type="color"
          onChange={(e) => onChangeDotColor(e.target.value)}
        />
      </div>

      <div className="customize-card">
        <label>Dot Shape</label>
        <select onChange={(e) => onChangeDotShape(e.target.value)}>
          <option value="rounded">Rounded</option>
          <option value="dots">Dots</option>
          <option value="square">Square</option>
        </select>
      </div>

      <div className="customize-card">
        <label>Background Color</label>
        <input
          type="color"
          onChange={(e) => onChangeBgColor(e.target.value)}
        />
      </div>

      <div className="customize-card">
        <label>QR Size (px)</label>
        <input
          type="range"
          min="100"
          max="500"
          defaultValue="300"
          step="10"
          onChange={(e) => onChangeSize(parseInt(e.target.value))}
        />
      </div>
    </div>
  );
};

export default Customize;
