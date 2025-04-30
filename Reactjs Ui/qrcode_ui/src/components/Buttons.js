import React from "react";

const Buttons = ({ onDownload  }) => {
  if (!onDownload ) return null;

  return (
    <div style={{ marginTop: '20px', textAlign: 'center' }}>
      <button
        onClick={() =>
            onDownload.download({ name: 'qr-code', extension: 'png' })
        }
        style={{
          padding: '10px 20px',
          background: '#0d6efd',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        Download QR
      </button>
    </div>
  );
};

export default Buttons;
