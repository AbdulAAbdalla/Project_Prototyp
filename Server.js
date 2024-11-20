require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const path = require('path');
const helmet = require('helmet');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const cors = require('cors');
const cron = require('node-cron');
const app = express();
const port = process.env.PORT || 4000;
const cleanupExpiredTokens = () => {
    const query = 'DELETE FROM tokens WHERE expires_at < NOW()';

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error cleaning up expired tokens:', err);
        } else {
            console.log(`Removed ${results.affectedRows} expired tokens.`);
        }
    });
};

// Schedule the cleanup job to run every 30 minutes
cron.schedule('*/30 * * * *', () => {
    console.log('Running token cleanup...');
    cleanupExpiredTokens();
});

// JWT authentication middleware
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        req.user = user; // Attach user info to request
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

// Middleware to check if token is blacklisted
function isTokenBlacklisted(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (token) {
        connection.query('SELECT * FROM tokens WHERE token = ? AND blacklisted = TRUE', [token], (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'Error checking token status' });
            }
            if (results.length > 0) {
                return res.status(401).json({ message: 'Token is blacklisted.' });
            }
            next();
        });
    } else {
        return res.status(401).json({ message: 'No token provided' });
    }
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));
app.use(helmet());
app.use(cors());
app.use('/booking', authenticateJWT);
app.use('/payments', authenticateJWT);

// Create a connection to the MySQL server
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

// Promisify query for easier usage with async/await
const query = promisify(connection.query).bind(connection);

// Connect to the MySQL server
connection.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL server:', err);
        return;
    }
    console.log('Connected to MySQL server.');

    // Check if the database exists
    const dbName = process.env.DB_NAME;
    connection.query(`SHOW DATABASES LIKE '${dbName}'`, (err, results) => {
        if (err) {
            console.error('Error checking database existence:', err);
            connection.end();
            return;
        }

        if (results.length === 0) {
            // Database does not exist, create it
            connection.query(`CREATE DATABASE ${dbName}`, err => {
                if (err) {
                    console.error('Error creating database:', err);
                } else {
                    console.log('Database created successfully.');
                }
                // After creating the database, connect to it and create tables
                setupDatabase();
            });
        } else {
            console.log('Database already exists.');
            // Connect to the existing database and create tables
            setupDatabase();
        }
    });
});

// Function to setup the database and create tables
async function setupDatabase() {
    return new Promise((resolve, reject) => {
        // Update the connection with the specific database
        connection.changeUser({ database: process.env.DB_NAME }, async err => {
            if (err) {
                console.error('Error selecting database:', err);
                return reject(err);
            }
            console.log('Connected to MySQL database.');

            // Create tables if they don't exist
            const createTables = async () => {
                try {
                    const createUsersTable = `
                        CREATE TABLE IF NOT EXISTS users (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            username VARCHAR(255) NOT NULL,
                            phone_number VARCHAR(20),
                            email VARCHAR(255) UNIQUE NOT NULL,
                            password VARCHAR(255) NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `;

                    const createBookingsTable = `
                        CREATE TABLE IF NOT EXISTS bookings (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            user_id INT,
                            name VARCHAR(255) NOT NULL,
                            email VARCHAR(255) NOT NULL,
                            gender ENUM('male', 'female') NOT NULL,
                            phone_number VARCHAR(20),
                            service VARCHAR(255) NOT NULL,
                            details TEXT,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                        )
                    `;

                    const createEnquiriesTable = `
                        CREATE TABLE IF NOT EXISTS enquiries (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            name VARCHAR(255) NOT NULL,
                            phone_number VARCHAR(20),
                            email VARCHAR(255) NOT NULL,
                            message TEXT NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `;

                    const createPaymentsTable = `
                        CREATE TABLE IF NOT EXISTS payments (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            booking_id INT,
                            payment_method ENUM('credit-card', 'paypal', 'bank-transfer', 'mpesa') NOT NULL,
                            payment_status ENUM('pending', 'completed', 'failed') NOT NULL,
                            payment_amount DECIMAL(10, 2) NOT NULL,
                            payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
                        )
                    `;

                    const createCreditCardPaymentsTable = `
                        CREATE TABLE IF NOT EXISTS credit_card_payments (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            payment_id INT,
                            card_number TEXT NOT NULL,
                            expiry_date TEXT NOT NULL,
                            cvc TEXT NOT NULL,
                            iv VARCHAR(32) NOT NULL,  -- Add the column for the initialization vector (if used)
                            FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
                        )
                    `;

                    const createBankTransferDetailsTable = `
                        CREATE TABLE IF NOT EXISTS bank_transfer_details (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            payment_id INT,
                            bank_name VARCHAR(255) NOT NULL,
                            account_number VARCHAR(20) NOT NULL,
                            phone_number VARCHAR(20),
                            transaction_code VARCHAR(20) NOT NULL,
                            FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
                        )
                    `;

                    const createPayPalPaymentsTable = `
                        CREATE TABLE IF NOT EXISTS paypal_payments (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            payment_id INT,
                            payment_email VARCHAR(255) NOT NULL,
                            transaction_id VARCHAR(255) NOT NULL,
                            paypal_status ENUM('pending', 'completed') NOT NULL,
                            FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
                        )
                    `;

                    const createMpesaPaymentsTable = `
                        CREATE TABLE IF NOT EXISTS mpesa_payments (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            payment_id INT,
                            mpesa_number VARCHAR(10) NOT NULL,
                            transaction_code VARCHAR(10) NOT NULL,
                            FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
                        )
                    `;

                    const createTokensTable = `
                    CREATE TABLE IF NOT EXISTS tokens (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        token VARCHAR(255) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        expires_at TIMESTAMP NOT NULL,
                        blacklisted BOOLEAN DEFAULT FALSE,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                    )
                    `;

                    // Execute all table creation queries
                    await query(createUsersTable);
                    await query(createBookingsTable);
                    await query(createEnquiriesTable);
                    await query(createPaymentsTable);
                    await query(createCreditCardPaymentsTable);
                    await query(createBankTransferDetailsTable);
                    await query(createPayPalPaymentsTable);
                    await query(createMpesaPaymentsTable);
                    await query(createTokensTable); // Execute tokens table creation

                    console.log('All tables created successfully!');
                    resolve(); // Resolve the promise when done
                } catch (error) {
                    console.error('Error creating tables:', error);
                    reject(error); // Reject the promise if there's an error
                }
            };

            // Call the createTables function
            await createTables();
        });
    });
}

// Call setupDatabase function and handle errors
setupDatabase().catch(error => {
    console.error('Error setting up database:', error);
});

// Middleware Encryption configuration
const algorithm = 'aes-256-cbc';
const encryptionKey = process.env.ENCRYPTION_KEY; // 32 bytes

// Encrypt function with unique IV for every encryption operation
function encrypt(text) {
    const iv = crypto.randomBytes(16);  // Generate a new IV each time
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(encryptionKey, 'hex'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { iv: iv.toString('hex'), encryptedData: encrypted };
}
// Decrypt function using IV and encrypted data
function decrypt(encryptedData, iv) {
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(encryptionKey, 'hex'), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = { encrypt, decrypt };

// Routes
// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Booking route
app.post('/booking', [authenticateJWT, isTokenBlacklisted], (req, res) => {
    const { name, email, gender, phone_number, service, details } = req.body;
    const userId = req.user.id; // Get user ID from token

    const query = 'INSERT INTO bookings (user_id, name, email, gender, phone_number, service, details) VALUES (?, ?, ?, ?, ?, ?, ?)';
    connection.query(query, [userId, name, email, gender, phone_number, service, details], function (err, result) {
        if (err) {
            console.error('Error saving booking:', err);
            return res.status(500).json({ message: 'Error saving booking' });
        }
        const bookingId = result.insertId; // Get the newly created booking ID
        res.json({ message: 'Booking saved successfully', booking_id: bookingId });
    });
});

// Route to handle payment creation
app.post('/payments', [authenticateJWT, isTokenBlacklisted], async (req, res) => {
    const { booking_id } = req.body;

    if (!booking_id) {
        return res.status(400).json({ message: 'Missing booking_id.' });
    }

    try {
        // Get booking details
        const [bookingDetails] = await query('SELECT * FROM bookings WHERE id = ?', [booking_id]);
        if (!bookingDetails) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        // Fetch payment details
        const paymentRecord = await query(`
            SELECT p.payment_method, p.payment_status, p.payment_amount, 
                   c.card_number, c.expiry_date, c.cvc, 
                   pp.payment_email, pp.transaction_id, 
                   b.bank_name, b.account_number, b.transactions_code, 
                   m.mpesa_number, m.transaction_code
            FROM payments p
            LEFT JOIN credit_card_payments c ON p.id = c.payment_id
            LEFT JOIN paypal_payments pp ON p.id = pp.payment_id
            LEFT JOIN bank_transfer_details b ON p.id = b.payment_id
            LEFT JOIN mpesa_payments m ON p.id = m.payment_id
            WHERE p.booking_id = ?
        `, [booking_id]);

        if (!paymentRecord.length) {
            return res.status(404).json({ message: 'Payment record not found.' });
        }

        const paymentDetails = paymentRecord[0];
        res.status(200).json({
            payment_method: paymentDetails.payment_method,
            payment_status: paymentDetails.payment_status,
            payment_amount: paymentDetails.payment_amount,
            credit_card_details: paymentDetails.card_number ? {
                card_number: paymentDetails.card_number,
                expiry_date: paymentDetails.expiry_date,
                cvc: paymentDetails.cvc
            } : null,
            paypal_details: paymentDetails.payment_email ? {
                payment_email: paymentDetails.payment_email,
                transaction_id: paymentDetails.transaction_id
            } : null,
            bank_transfer_details: paymentDetails.bank_name ? {
                bank_name: paymentDetails.bank_name,
                account_number: paymentDetails.account_number,
                transactions_code: paymentDetails.transactions_code
            } : null,
            mpesa_details: paymentDetails.mpesa_number ? {
                mpesa_number: paymentDetails.mpesa_number,
                transaction_code: paymentDetails.transaction_code
            } : null
        });
    } catch (error) {
        console.error('Error fetching payment record:', error);
        res.status(500).json({ message: 'Error fetching payment record.', error: error.message });
    }
});

// Enquiry route
app.post('/enquiries', async (req, res) => { // Add async here
    const { name, phone_number, email, message } = req.body;

    // Simple validation
    if (!name || !phone_number|| !email || !message) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    console.log('Received enquiry:', { phone_number, name, email, message });

    const query = promisify(connection.query).bind(connection);
    try {
        await query('INSERT INTO enquiries ( name, phone_number, email, message) VALUES (?, ?, ?, ?)', [name, phone_number, email, message]);
        res.json({ message: 'Enquiry saved successfully' });
    } catch (err) {
        console.error('Error saving enquiry:', err);
        res.status(500).json({ message: 'Error saving enquiry', error: err.message });
    }
});

// Register Route
app.post('/register', async (req, res) => {
    const { username, phone_number, email, password } = req.body;

    try {
        // Input validation
        if (!username || !phone_number|| !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if email already exists
        const checkQuery = 'SELECT * FROM users WHERE email = ?';
        const existingUser = await new Promise((resolve, reject) => {
            connection.query(checkQuery, [email], (err, results) => {
                if (err) return reject(err);
                resolve(results.length ? results[0] : null);  
            });
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user
        const insertQuery = 'INSERT INTO users (username, phone_number, email, password) VALUES (?, ?, ?, ?)';
        await new Promise((resolve, reject) => {
            connection.query(insertQuery, [username, phone_number, email, hashedPassword], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        // Return success message
        res.status(201).json({ message: 'Registration successful' });

    } catch (err) {
        console.error('Error during registration:', err.message);
        res.status(500).json({ message: err.message });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM users WHERE email = ?';
    connection.query(query, [email], async (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).json({ success: false, message: 'Error logging in' });
        }

        if (results.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);

        if (match) {
            const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '25m' });
            console.log('User found:', user);

            // Store the token in the database
            const expiresAt = new Date(Date.now() + 25 * 60 * 1000); // Token expiration time
            const insertQuery = 'INSERT INTO tokens (user_id, token, expires_at) VALUES (?, ?, ?)';
            
            connection.query(insertQuery, [user.id, token, expiresAt], (insertErr) => {
                if (insertErr) {
                    console.error('Error storing token:', insertErr);
                    return res.status(500).json({ success: false, message: 'Error storing token' });
                }
                
                // Successful login response
                return res.json({ success: true, token, username: user.username, email: user.email });
            });
        } else {
            console.log('Invalid password attempt for user:', email);
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }
    });

    // Cleanup expired tokens after a successful login
    cleanupExpiredTokens();
});

app.post('/logout', async (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header

    if (!token) {
        return res.status(403).json({ success: false, message: 'Forbidden: No token provided' });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Forbidden: Invalid token' });
        }

        // Proceed to delete the token from the database
        const query = 'DELETE FROM tokens WHERE token = ?';
        
        connection.query(query, [token], (err) => {
            if (err) {
                console.error('Error during logout:', err);
                return res.status(500).json({ success: false, message: 'Error logging out' });
            }

            res.json({ success: true, message: 'Successfully logged out' });
        });
    });
});

// Cleanup expired tokens after a logout
cleanupExpiredTokens();

// Endpoint to Check Token
app.get('/check-token', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        console.log('Token not found in request headers');
        return res.status(403).json({ valid: false, message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log('Invalid or expired token:', err);
            return res.status(403).json({ valid: false, message: 'Invalid or expired token' });
        }

        // Check if the token exists in the database
        const query = 'SELECT * FROM tokens WHERE token = ?';
        connection.query(query, [token], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ valid: false, message: 'Database error' });
            }

            if (results.length === 0) {
                console.log('Token not found in database');
                return res.status(403).json({ valid: false, message: 'Token not found in database' });
            }

            // Return success and user info if token is valid
            console.log('Token is valid:', decoded);
            res.json({ valid: true, username: decoded.username || decoded.email });
        });
    });
});

// Decrypt card data when needed
app.get('/decrypted-card-details/:paymentId', async (req, res) => {
    const paymentId = parseInt(req.params.paymentId, 10);

    if (isNaN(paymentId)) {
        return res.status(400).json({ message: 'Invalid payment ID.' });
    }

    try {
        const results = await query('SELECT * FROM credit_card_payments WHERE payment_id = ?', [paymentId]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        const encryptedData = results[0];
        const decryptedCardNumber = decrypt(encryptedData.card_number, encryptedData.iv);
        const decryptedExpiryDate = decrypt(encryptedData.expiry_date, encryptedData.iv);
        const decryptedCvc = decrypt(encryptedData.cvc, encryptedData.iv);

        res.json({
            cardNumber: decryptedCardNumber,
            expiryDate: decryptedExpiryDate,
            cvc: decryptedCvc
        });
    } catch (error) {
        console.error('Error fetching card details:', error);
        res.status(500).json({ message: 'Error fetching card details', error });
    }
});

// Route for handling payments with credit card
app.post('/credit-card-payments', async (req, res) => {
    const { booking_id, card_number, expiry_date, cvc } = req.body;

    if (!booking_id || !card_number || !expiry_date || !cvc) {
        return res.status(400).json({ message: 'Missing required fields for credit card payment.' });
    }

    // Encrypt sensitive data
    const encryptedCardNumber = encrypt(card_number);
    const encryptedExpiryDate = encrypt(expiry_date);
    const encryptedCvc = encrypt(cvc);

    try {
        // Insert payment record
        const result = await query('INSERT INTO payments (booking_id, payment_method, payment_status, payment_amount) VALUES (?, ?, ?, ?)', [booking_id, 'credit-card', 'completed', 1000]);
        const paymentId = result.insertId;

        // Insert credit card details
        await query('INSERT INTO credit_card_payments (payment_id, card_number, expiry_date, cvc, iv) VALUES (?, ?, ?, ?, ?)', [paymentId, encryptedCardNumber.encryptedData, encryptedExpiryDate.encryptedData, encryptedCvc.encryptedData, encryptedCardNumber.iv]);

        res.status(201).json({ message: 'Credit card payment record created.' });
    } catch (error) {
        console.error('Error creating credit card payment record:', error);
        res.status(500).json({ message: 'Error creating credit card payment record.', error });
    }
});

// Route for handling payments with PayPal
app.post('/paypal-payments',  async (req, res) => {
    const { booking_id, payment_email, transaction_id } = req.body;

    if (!booking_id || !payment_email || !transaction_id) {
        return res.status(400).json({ message: 'Missing required fields for PayPal payment.' });
    }

    try {
        // Insert payment record
        const result = await query('INSERT INTO payments (booking_id, payment_method, payment_status, payment_amount) VALUES (?, ?, ?, ?)', [booking_id, 'paypal', 'completed', 1000.00]);
        const paymentId = result.insertId;

        // Insert PayPal details
        await query('INSERT INTO paypal_payments (payment_id, payment_email, transaction_id) VALUES (?, ?, ?)', [paymentId, payment_email, transaction_id]);

        res.status(201).json({ message: 'PayPal payment record created.' });
    } catch (error) {
        console.error('Error creating PayPal payment record:', error);
        res.status(500).json({ message: 'Error creating PayPal payment record.', error: error.message });
    }
});

// Route for handling payments with bank transfer
app.post('/bank-transfer-payments', async (req, res) => {
    const { booking_id, bank_name, account_number, phone_number, transaction_code } = req.body; // Changed from 'transactions_code' to 'transaction_code'

    if (!booking_id || !bank_name || !account_number || !phone_number || !transaction_code) {
        return res.status(400).json({ message: 'Missing required fields for bank transfer payment.' });
    }

    try {
        // Insert payment record
        const result = await query('INSERT INTO payments (booking_id, payment_method, payment_status, payment_amount) VALUES (?, ?, ?, ?)', [booking_id, 'bank-transfer', 'completed', 1000.00]);
        const paymentId = result.insertId;

        // Insert bank transfer details
        await query('INSERT INTO bank_transfer_details (payment_id, bank_name, account_number, phone_number, transaction_code) VALUES (?, ?, ?, ?, ?)', [paymentId, bank_name, account_number, phone_number, transaction_code]); // Changed from 'transactions_code' to 'transaction_code'

        res.status(201).json({ message: 'Bank transfer payment record created.' });
    } catch (error) {
        console.error('Error creating bank transfer payment record:', error);
        res.status(500).json({ message: 'Error creating bank transfer payment record.', error });
    }
});

// Route for handling payments with Mpesa
app.post('/mpesa-payments', async (req, res) => {
    const { booking_id, mpesa_number, transaction_code } = req.body;

    if (!booking_id || !mpesa_number || !transaction_code) {
        return res.status(400).json({ message: 'Missing required fields for Mpesa payment.' });
    }

    try {
        // Insert payment record
        const result = await query('INSERT INTO payments (booking_id, payment_method, payment_status, payment_amount) VALUES (?, ?, ?, ?)', [booking_id, 'mpesa', 'completed', 1000.00]);
        const paymentId = result.insertId;

        // Insert Mpesa details
        await query('INSERT INTO mpesa_payments (payment_id, mpesa_number, transaction_code) VALUES (?, ?, ?)', [paymentId, mpesa_number, transaction_code]);

        res.status(201).json({ message: 'Mpesa payment record created.' });
    } catch (error) {
        console.error('Error creating Mpesa payment record:', error);
        res.status(500).json({ message: 'Error creating Mpesa payment record.', error });
    }
});


// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    cleanupExpiredTokens();
});