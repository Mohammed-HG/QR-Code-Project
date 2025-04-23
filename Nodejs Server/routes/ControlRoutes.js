const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router(); // Use the router

let userOTP = {}; // Store OTPs temporarily

// Send OTP via phone function (Placeholder)
const sendOTPSMS = (phone, otp) => {
    console.log(`Sending OTP ${otp} to phone number ${phone}`);
};

// Register endpoint 
router.post('/register', async (req, res) => {
    const {username, password, email} = req.body;
    const hashedPassword = await bcrypt.hash(password,10);
    const sql = 'Insert Into `users` (username, password, email) Values (?, ?, ?)'; 

    db.query(sql, [username, hashedPassword, email], (err, result) => {
        if (err) {
            console.error('Error Registering User:', err);
            return res.status(500).json({error:'Internal Server Error'});
        }
        res.status(201).send('User Registered');
    })
})

// Login endpoint
router.post('/login', async (req, res) => {
    const {username, password} = req.body;
    const sql = 'Select * From `users` Where username = ?';

    db.query(sql, [username], async (err, results) => {
        if (err) {
            console.error('Error Fetching User:', err);
            return res.status(500).json({error:'Internal Server Error'});
        }
        if (results.length === 0) {
            return res.status(401).send('Invalid Credentials');
        }
        const user = results[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (isPasswordValid) {
            const token = jwt.sign({userId: user.UserId, username: user.username},'your_jwt_secret', {expiresIn: '1h'});
            res.json({token});
        }else {
            res.status(401).send('Invalid Credentials');
        }
    })
})

// Logout endpoint
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.clearCookie('connect.sid', { path:'/'});
        res.status(200).json({ message: 'Logged out Succssfully' });
    });
});
module.exports = router;

// Send OTP endpoint 
router.post('/send-otp', (req, res) => { 
    const { contact, type } = req.body; 
    const otp = crypto.randomInt(100000, 999999).toString(); 
    userOTP[contact] = otp; 

    sendOTPSMS(contact, otp); 
    res.status(200).send('OTP Sent'); 

}); 

// Verify OTP endpoint 
router.post('/verify-otp', authenticateToken, (req, res) => { 
    const { contact, otp } = req.body; 
        if (userOTP[contact] === otp) { 
            delete userOTP[contact]; 
            res.status(200).send('OTP Verified'); 
        } else { 
            res.status(400).send('Invalid OTP'); 
        }
});

//Get (Me) User endpoint
router.get('/users/me', authenticateToken, (req, res) => {
    const userId = req.user; // Accessing user ID from the token
    console.log('User ID from token:', userId); // Log userId to ensure it's correct
    const sql = 'Select `username`, `UserId` From `users` Where `UserId` = ?';

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error feching user:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (results.length > 0) {
            res.json(results[0])
        } else {
            res.status(404).json({ message: 'User Not Found'});
        }
    });
});
module.exports = router;

// MiddleWare function
function authenticateToken(req, res, next) {
    const authHeader = req.header('Authorization')
    const token = authHeader && authHeader.split(' ') [1];
    if (!token) {
        console.log('No token provided');
        return res.sendStatus(401);
    }

    jwt.verify(token, 'your_jwt_secret', (err, user) => {
        if (err) 
            {console.log('Token verification failed:', err);
            return res.sendStatus(403);
            }
        console.log('User from token:', user);  
        req.user = user;
        next();
    });
}
