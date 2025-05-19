import React, { useState, forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import axios from 'axios';
import MessageModal from './MessageModal';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/QRCode_generator.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const LocationQR = forwardRef(({ setQrData }, ref) => {
    const [position, setPosition] = useState([25.383, 49.586]); // الأحساء بشكل افتراضي
    const [isLoading, setIsLoading] = useState(false);
    const qrRef = useRef();

    const [modalShow, setModalShow] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const [modalFooter, setModalFooter] = useState('');  
    const handleClose = () => setModalShow(false);

    const generateLocationQR = async () => {
        const [latitude, longitude] = position;
        const locationData = `geo:${latitude},${longitude}`;
        
        try {
            setIsLoading(true);
            const locationData = `geo:${latitude},${longitude}`;
            const response = await axios.post(
                'http://localhost:3200/qr/generate-qr/location',
                { locationData },
                { responseType: 'blob' }
            );
            const blob = response.data;
            const imageUrl = URL.createObjectURL(blob);
            setQrData(imageUrl);
          } catch (err) {
            setModalTitle('Error');
            setModalMessage('Failed to generate QR Code!');
            setModalFooter('error code: 500');
            setModalShow(true);
            console.error(err);
          } finally {
            setIsLoading(false);
          }
        };

    useImperativeHandle(ref, () => ({
        generate: generateLocationQR,
        loading: isLoading,
        disabled: !position,
        download: () => {
          if (!qrRef.current) return;
          const a = document.createElement('a');
          a.href = qrRef.current.src;
          a.download = 'location-qr-code.png';
          a.click();
        }
      }), [position, isLoading]);
    
      useEffect(() => {
        if (position) generateLocationQR();
      }, [position]);
    
      function MapClickHandler() {
        useMapEvents({
          click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
          },
        });
        return null;
      }
    
      return (
        <div className='location-container'>
          <h2>Location QR Code</h2>
          
          <MapContainer center={position} zoom={15} style={{ height: 300, width: '100%', marginBottom: 20 }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position} />
            <MapClickHandler />
          </MapContainer>
    
          <div className="qr-container">
            <img ref={qrRef} style={{ maxWidth: '100%', borderRadius: '16px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' }} />
          </div>

          <MessageModal
            show={modalShow}
            handleClose={handleClose}
            title={modalTitle}
            message={modalMessage}
            footer={modalFooter}
          />
        </div>
      );
    });
    
    export default LocationQR;