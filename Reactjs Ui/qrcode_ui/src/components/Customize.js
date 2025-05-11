import React, { useState, useEffect } from "react";
import axios from "axios";
import '../styles/Customize.css';

const Customize = ({ text, setQrData }) => {
    const [dotColor, setDotColor] = useState("#000000");
    const [bgColor, setBgColor] = useState("#ffffff");
    const [dotShape, setDotShape] = useState("rounded");
    const [size, setSize] = useState(300);

    useEffect(() => {
        const generateCustomizedQR = async () => {
            if (!text) return;
            try {
                const response = await axios.post("http://localhost:3200/qr/customize-qr", {
                    text,
                    dotColor,
                    dotShape,
                    bgColor,
                    size
                }, { responseType: 'blob' });
                const blob = response.data;
                const imageUrl = URL.createObjectURL(blob);
                setQrData(imageUrl);
            } catch (err) {
                console.error("Failed to generate customized QR code", err);
            }
        };

        generateCustomizedQR();
    }, [text, dotColor, dotShape, bgColor, size, setQrData]);

    return (
        <div className="customize-container">
            <div className="customize-card">
                <label>Dot Color</label>
                <input type="color" value={dotColor} onChange={(e) => setDotColor(e.target.value)} />
            </div>
            <div className="customize-card">
                <label>Background Color</label>
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
            </div>
            <div className="customize-card">
                <label>Dot Shape</label>
                <select value={dotShape} onChange={(e) => setDotShape(e.target.value)}>
                    <option value="rounded">Rounded</option>
                    <option value="dots">Dots</option>
                    <option value="square">Square</option>
                </select>
            </div>
            <div className="customize-card">
                <label>QR Size (px)</label>
                <input type="range" min="100" max="1500" value={size} onChange={(e) => setSize(parseInt(e.target.value))} />
            </div>
        </div>
    );
};

export default Customize;
