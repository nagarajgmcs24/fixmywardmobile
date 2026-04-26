const Notification = require('../models/Notification');
const User = require('../models/User');

// Send notification to a user
exports.sendNotification = async (user_id, message, complaint_id = null) => {
  await Notification.create({ user_id, message, complaint_id });
};

// Get notifications for a user
exports.getNotifications = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const mongoose = require('mongoose');
    const notifications = await Notification.find({ 
      user_id: new mongoose.Types.ObjectId(user_id) 
    }).sort({ created_at: -1 });
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notification_id } = req.params;
    await Notification.findByIdAndUpdate(notification_id, { read: true });
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
