const User = require('../models/User');
const Complaint = require('../models/Complaint');

// Get admin dashboard stats
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalComplaints = await Complaint.countDocuments();
    const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });
    const pendingComplaints = await Complaint.countDocuments({ status: { $ne: 'resolved' } });
    res.json({
      totalUsers,
      totalComplaints,
      resolvedComplaints,
      pendingComplaints
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// List all users (admin only)
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ created_at: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update user role (admin only)
exports.updateUserRole = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { role } = req.body;
    if (!role) return res.status(400).json({ message: 'Role required' });
    const user = await User.findByIdAndUpdate(user_id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Role updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
