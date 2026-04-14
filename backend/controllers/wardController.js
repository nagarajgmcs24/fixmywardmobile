const WardAssignment = require('../models/WardAssignment');
const User = require('../models/User');

// Assign a user to a ward (admin/councillor only)
exports.assignWard = async (req, res) => {
  try {
    const { user_id, ward_id } = req.body;
    if (!user_id || !ward_id) return res.status(400).json({ message: 'user_id and ward_id required' });

    // End previous assignment if exists
    await WardAssignment.updateMany({ user_id, end_date: null }, { end_date: new Date() });

    // Create new assignment
    const assignment = await WardAssignment.create({ user_id, ward_id });
    // Update user's ward_id
    await User.findByIdAndUpdate(user_id, { ward_id });
    res.json({ message: 'Ward assigned', assignment });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get current ward assignment for a user
exports.getCurrentAssignment = async (req, res) => {
  try {
    const user_id = req.params.user_id;
    const assignment = await WardAssignment.findOne({ user_id, end_date: null });
    res.json({ assignment });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get assignment history for a user
exports.getAssignmentHistory = async (req, res) => {
  try {
    const user_id = req.params.user_id;
    const history = await WardAssignment.find({ user_id }).sort({ start_date: -1 });
    res.json({ history });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
