const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT;

if (!PORT) {
    console.error('PORT is not defined in the environment variables.');
    process.exit(1); 
  }
  

/*const jwtSecret = process.env.JWT_SECRET;
const sessionSecret = process.env.SESSION_SECRET;*/

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ 
    secret: 'your_session_secret', // Change this to a secure secret 
    resave: false, 
    saveUninitialized: true, 
    cookie: { secure: false } // Set to true if using HTTPS 
    }));


const QRRoutes = require('./routes/QRCodeRoutes');
const ControlRoutes = require('./routes/ControlRoutes');

app.use('/api', ControlRoutes);
app.use('/qr', QRRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
