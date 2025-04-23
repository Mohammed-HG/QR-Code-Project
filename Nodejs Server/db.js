const mysql = require('mysql2');

require('dotenv').config({ path: './QR-Code-Project/Nodejs Server/.env'});

// DataBase Connection
const db = mysql.createConnection({

    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  }) ;

  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    console.error('Missing required environment variables');
    process.exit(1); 
};

db.connect ((err) => {
    if (err) { 
        console.error('Error connecting to the database:', err);
    }
    else {
        console.log('Connected to the database!');
    }
});

module.exports = db;