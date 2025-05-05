import React from "react";

const Buttons = ({ onDownload, onGenerate, isLoading, disabled, generateText = "Generate QR" }) => {
    return (
        <div>
          <button
            onClick={onGenerate}
            disabled={disabled || isLoading}
            style={{ padding: '10px 20px', marginRight: '10px' }}
          >
            {isLoading ? 'Generating...' : generateText}
          </button>
    
          <button
            onClick={onDownload}
            style={{ padding: '10px 20px', background: '#007bff', color: 'white' }}
          >
            Download QR
          </button>
        </div>
      );
    };
export default Buttons;
