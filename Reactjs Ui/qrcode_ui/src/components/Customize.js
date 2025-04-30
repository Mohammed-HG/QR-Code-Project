import React from "react";

const Customize = ({  onChangeColor, onChangeType  }) => {
  if (!onChangeColor, onChangeType) return null;

  return (
    <div style={{ marginTop: '20px' }}>
      <label style={{ fontWeight: 'bold' }}>لون النقاط:</label>
      <input
        type="color"
        onChange={(e) =>
          onChangeColor.update({ dotsOptions: { color: e.target.value } })
        }
        style={{ marginLeft: '10px' }}
      />

      <br /><br />

      <label style={{ fontWeight: 'bold' }}>شكل النقاط:</label>
      <select
        onChange={(e) =>
          onChangeType.update({ dotsOptions: { type: e.target.value } })
        }
        style={{ marginLeft: '10px', padding: '5px' }}
      >
        <option value="rounded">Rounded</option>
        <option value="dots">Dots</option>
        <option value="square">Square</option>
      </select>

      <br /><br />

      <label style={{ fontWeight: 'bold' }}>لون الخلفية:</label>
      <input
        type="color"
        onChange={(e) =>
          onChangeColor.update({ backgroundOptions: { color: e.target.value } })
        }
        style={{ marginLeft: '10px' }}
      />
    </div>
  );
};

export default Customize;
