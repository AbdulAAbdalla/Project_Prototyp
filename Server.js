const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// MySQL database connection setup
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Dunya@Riek2027',
    database: 'clientbooking'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database');
});

// Routes

// Home route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/booking', (req, res) => {
    const { name, email, gender, homePhone, officePhone, service } = req.body;
    const query = 'INSERT INTO bookings (name, email, gender, home_phone, office_phone, service) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [name, email, gender, homePhone, officePhone, service], (err, result) => {
        if (err) {
            res.status(500).send('Error saving booking');
        } else {
            res.send('Booking saved successfully');
        }
    });
});

// Enquiry form submission
app.post('/enquire', (req, res) => {
    const { name, email, message } = req.body;
    const query = 'INSERT INTO enquiries (name, email, message) VALUES (?, ?, ?)';
    db.query(query, [name, email, message], (err, result) => {
        if (err) {
            res.status(500).send('Error saving enquiry');
        } else {
            res.send('Enquiry saved successfully');
        }
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
