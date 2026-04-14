const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
// const db = require('../database/db'); // Removed for MongoDB migration
const { OAuth2Client } = require('google-auth-library');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Temporary in-memory OTP store
const otpStore = {};

// Helper: upsert user in DB and return JWT
async function loginOrCreateUser({ phone, email, name, google_id, apple_id }) {
    try {
        // Check if user exists by google_id, apple_id, phone, or email
        let user;
        if (google_id) {
            const [rows] = await db.query('SELECT * FROM users WHERE google_id = ?', [google_id]);
            user = rows[0];
        } else if (apple_id) {
            const [rows] = await db.query('SELECT * FROM users WHERE apple_id = ?', [apple_id]);
            user = rows[0];
        } else if (phone) {
            const [rows] = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);
            user = rows[0];
        }

        if (!user) {
            // Create new user
            const [result] = await db.query(
                'INSERT INTO users (phone, email, name, google_id, apple_id, role) VALUES (?, ?, ?, ?, ?, "citizen")',
                [phone || null, email || null, name || null, google_id || null, apple_id || null]
            );
            const [newRows] = await db.query('SELECT * FROM users WHERE user_id = ?', [result.insertId]);
            user = newRows[0];
        } else {
            // Update existing user info
            await db.query(
                'UPDATE users SET name = COALESCE(?, name), google_id = COALESCE(?, google_id), apple_id = COALESCE(?, apple_id), email = COALESCE(?, email) WHERE user_id = ?',
                [name || null, google_id || null, apple_id || null, email || null, user.user_id]
            );
        }

        const token = jwt.sign(
            { user_id: user.user_id, phone: user.phone, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return { token, user };
    } catch (err) {
        throw err;
    }
}

// POST /api/auth/login — email (or legacy username) + password (+ optional ward for citizens)
router.post('/login', async (req, res) => {
    const { email, username, password, ward_id } = req.body;
    const id = String(email ?? username ?? '').trim().toLowerCase();
    if (!id || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    try {
        const [rows] = await db.query(
            `SELECT * FROM users WHERE LOWER(TRIM(COALESCE(username, ''))) = ?
             OR LOWER(TRIM(COALESCE(email, ''))) = ?`,
            [id, id]
        );
        const user = rows[0];
        if (!user || !user.password_hash) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        if (ward_id != null && ward_id !== '' && user.role === 'citizen') {
            await db.query('UPDATE users SET ward_id = ? WHERE user_id = ?', [ward_id, user.user_id]);
            user.ward_id = Number(ward_id);
        }
        const token = jwt.sign(
            { user_id: user.user_id, phone: user.phone, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.json({ message: 'Login successful', token, user });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Login failed', error: err.message });
    }
});

// POST /api/auth/register — after OTP; creates account with email as username
router.post('/register', async (req, res) => {
    const { phone, otp, email, name, password, ward_id } = req.body;
    if (!phone || !otp || !email || !name || !password || ward_id == null || ward_id === '') {
        return res.status(400).json({ message: 'Email, name, password, ward, phone, and OTP are required' });
    }
    if (String(password).length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const storedData = otpStore[phone];
    if (!storedData || Date.now() > storedData.expires || storedData.otp !== String(otp)) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    delete otpStore[phone];

    const emailNorm = String(email).trim().toLowerCase();
    try {
        const [dup] = await db.query(
            'SELECT user_id FROM users WHERE email = ? OR username = ? OR phone = ?',
            [emailNorm, emailNorm, phone]
        );
        if (dup.length) {
            return res.status(400).json({ message: 'An account with this email or phone already exists' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            `INSERT INTO users (username, password_hash, phone, email, name, ward_id, role, is_verified)
             VALUES (?, ?, ?, ?, ?, ?, 'citizen', TRUE)`,
            [emailNorm, password_hash, phone, emailNorm, String(name).trim(), ward_id]
        );
        const [newRows] = await db.query('SELECT * FROM users WHERE user_id = ?', [result.insertId]);
        const user = newRows[0];
        const token = jwt.sign(
            { user_id: user.user_id, phone: user.phone, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.json({ message: 'Account created', token, user });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'An account with this email or phone already exists' });
        }
        console.error('Register error:', err);
        res.status(500).json({ message: 'Registration failed', error: err.message });
    }
});

// POST /api/auth/send-otp
router.post('/send-otp', (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone number is required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[phone] = { otp, expires: Date.now() + 5 * 60 * 1000 };

    console.log(`[MOCK SMS] OTP for ${phone}: ${otp}`);
    // In production: Call Twilio/MSG91 here
    res.json({ message: 'OTP sent successfully', dev_otp: process.env.NODE_ENV !== 'production' ? otp : undefined });
});

// POST /api/auth/verify-otp — optional google_id, email for completing Google sign-in
router.post('/verify-otp', async (req, res) => {
    const { phone, otp, name, google_id, email } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: 'Phone and OTP are required' });

    const storedData = otpStore[phone];
    if (!storedData || Date.now() > storedData.expires || storedData.otp !== otp) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    delete otpStore[phone];

    try {
        const { token, user } = await loginOrCreateUser({ phone, name, google_id, email });
        res.json({ message: 'Login successful', token, user });
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err.message });
    }
});

// POST /api/auth/google — Verify Google ID Token and login/register
router.post('/google', async (req, res) => {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'Google ID Token is required' });

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub: google_id, email, name } = payload;

        const { token, user } = await loginOrCreateUser({ google_id, email, name });
        res.json({ message: 'Google login successful', token, user });
    } catch (err) {
        console.error('Google OAuth error:', err.message);
        res.status(401).json({ message: 'Invalid Google token', error: err.message });
    }
});

// POST /api/auth/apple — Verify Apple Identity Token
router.post('/apple', async (req, res) => {
    const { identityToken, email, name } = req.body;
    if (!identityToken) return res.status(400).json({ message: 'Apple Identity Token is required' });

    try {
        // Decode JWT without verification to get apple_id (sub claim)
        // In production, verify with Apple's public keys
        const decoded = jwt.decode(identityToken);
        if (!decoded || !decoded.sub) throw new Error('Invalid Apple token');
        
        const apple_id = decoded.sub;
        const { token, user } = await loginOrCreateUser({ apple_id, email, name });
        res.json({ message: 'Apple login successful', token, user });
    } catch (err) {
        console.error('Apple OAuth error:', err.message);
        res.status(401).json({ message: 'Invalid Apple token', error: err.message });
    }
});

module.exports = router;
