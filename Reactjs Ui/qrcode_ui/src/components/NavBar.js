import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
//import { handleLogout } from './Logout';
import MessageModal from "../components/MessageModal";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faInfoCircle, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

const NavBar = () => {
    const navigate = useNavigate();

    const [modalShow, setModalShow] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');

    /*const handleLogoutClick = (e) => {
        e.preventDefault();
        handleLogout(navigate, setModalShow, setModalTitle, setModalMessage);
    };*/

    const handleAccountClick = () => {
        navigate('/account');
    };

    const handleAboutClick = () => {
        navigate('/about');
    };

    return (
        <nav className="navbar navbar-expand-sm bg-dark navbar-dark">
            <div className="container-fluid">
                <a className="navbar-brand" href="#">QR Code Projerct</a>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto">
                        <li className="nav-item">
                            <button className="nav-link active btn btn-link" onClick={handleAccountClick}>
                                <FontAwesomeIcon icon={faUser} /> Account
                            </button>
                        </li>
                        <li className="nav-item">
                            <button className="nav-link btn btn-link" onClick={<></>}>
                                <FontAwesomeIcon icon={faSignOutAlt} /> Logout
                            </button>
                        </li>
                        <li className="nav-item">
                            <button className="nav-link btn btn-link" onClick={handleAboutClick}>
                                <FontAwesomeIcon icon={faInfoCircle} /> About
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
            <MessageModal
                show={modalShow}
                handleClose={() => setModalShow(false)}
                title={modalTitle}
                message={modalMessage}
            />
        </nav>
    );
};

export default NavBar;