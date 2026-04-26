const express = require('express');
const router = express.Router();
const { createComplaint, getComplaints, updateComplaintStatus, deleteComplaint } = require('../controllers/complaintController');
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


const multer = require('multer');
const path = require('path');

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Submit a complaint (citizen)
router.post('/', auth, requireRole('citizen'), upload.single('image'), createComplaint);
// Get complaints (all, by ward, by user, by status)
router.get('/', auth, getComplaints);
// Update complaint status (admin/councillor)
router.put('/:complaint_id/status', auth, requireRole('admin', 'councillor'), updateComplaintStatus);
// Delete complaint (citizen owner, councillor, or admin)
router.delete('/:complaint_id', auth, deleteComplaint);

module.exports = router;

