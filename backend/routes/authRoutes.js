const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';

// ─── JWT Auth Middleware (defined first so it can be used below) ───
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

const { sendOTP, verifyOTP, socialLogin, checkGoogle } = require('../controllers/authController');
const { register, login, deleteAccount, changePassword, checkEmail } = require('../controllers/passwordController');
const { updateProfile, getProfile } = require('../controllers/userController');
const requireRole = require('../middleware/requireRole');

// ─── Public routes ───
router.post('/check-email', checkEmail);
router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/check-google', checkGoogle);
router.post('/social-login', socialLogin);

// ─── Protected routes ───
router.delete('/delete', auth, deleteAccount);
router.put('/change-password', auth, changePassword);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.get('/admin-only', auth, requireRole('admin'), (req, res) => {
  res.json({ message: 'You are an admin!' });
});

module.exports = router;
