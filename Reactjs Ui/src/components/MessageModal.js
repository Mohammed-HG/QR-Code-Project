import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import styled from 'styled-components';
import '../styles/Modal.css'

const DarkModal = styled(Modal)`
  .modal-content {
    background-color: #333;
    color: #fff;
  }
`;

const DarkButton = styled(Button)`
  background-color: #555;
  border: none;
  &:hover {
    background-color: #777;
  }
  &:focus {
    box-shadow: none;
  }
`;

const MessageModal = ({ show, handleClose, title, message, footer }) => {
  return (
    <DarkModal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer className="custom-footer">
        <div className="footer-left">{footer}</div>
        <DarkButton onClick={handleClose}>Close</DarkButton>
      </Modal.Footer>
    </DarkModal>
  );
};

export default MessageModal;