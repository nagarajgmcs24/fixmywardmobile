const express = require('express');
const router = express.Router();
const { assignWard, getCurrentAssignment, getAssignmentHistory } = require('../controllers/wardController');
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

// GET /api/wards — list wards for signup / login selection (placeholder, update as needed)
router.get('/', (req, res) => {
    res.json([]); // TODO: Replace with actual ward list from DB if needed
});

// Assign ward (admin/councillor only)
router.post('/assign', auth, requireRole('admin', 'councillor'), assignWard);
// Get current assignment for user
router.get('/current/:user_id', auth, getCurrentAssignment);
// Get assignment history for user
router.get('/history/:user_id', auth, getAssignmentHistory);

module.exports = router;
