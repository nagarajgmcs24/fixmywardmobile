const express = require('express');
const router = express.Router();
const { sendOTP, verifyOTP, socialLogin } = require('../controllers/authController');
const { register, login, deleteAccount, changePassword } = require('../controllers/passwordController');
// Password-based registration and login
router.post('/register', register);
router.post('/login', login);
router.delete('/delete', auth, deleteAccount);
router.put('/change-password', auth, changePassword);

const { updateProfile, getProfile } = require('../controllers/userController');
const requireRole = require('../middleware/requireRole');

// Simple JWT auth middleware
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';
function auth(req, res, next) {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' });
	const token = authHeader.split(' ')[1];
	try {
		req.user = jwt.verify(token, JWT_SECRET);
		next();
	} catch {
		return res.status(401).json({ message: 'Invalid token' });
	}
}

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/social-login', socialLogin); // Google/Apple login

// Example: admin-only route
router.get('/admin-only', auth, requireRole('admin'), (req, res) => {
	res.json({ message: 'You are an admin!' });
});

router.get('/profile', auth, getProfile); // Get user profile
router.put('/profile', auth, updateProfile); // Update user profile

module.exports = router;
