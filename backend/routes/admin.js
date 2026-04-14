const express = require('express');
const router = express.Router();
const { getStats, listUsers, updateUserRole } = require('../controllers/adminController');
const jwt = require('jsonwebtoken');
const requireRole = require('../middleware/requireRole');

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

// Admin dashboard stats
router.get('/stats', auth, requireRole('admin'), getStats);
// List all users
router.get('/users', auth, requireRole('admin'), listUsers);
// Update user role
router.put('/users/:user_id/role', auth, requireRole('admin'), updateUserRole);

module.exports = router;
