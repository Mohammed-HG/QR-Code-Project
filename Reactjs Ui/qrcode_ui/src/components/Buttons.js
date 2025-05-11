import React from "react";
import '../styles/Customize.css';

const Buttons = ({ onDownload, onGenerate, isLoading, disabled, generateText = "Generate QR" }) => {
    return (
        <div>
          <button className="button-1"
            onClick={onGenerate}
            disabled={disabled || isLoading}
          >
            {isLoading ? 'Generating...' : generateText}
          </button>
    
          <button className="button-2"
            onClick={onDownload}
          >
            Download QR
          </button>
        </div>
      );
    };
export default Buttons;
