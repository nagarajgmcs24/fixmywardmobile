const Notification = require('../models/Notification');
const User = require('../models/User');

// Send notification to a user
exports.sendNotification = async (user_id, message) => {
  await Notification.create({ user_id, message });
};

// Get notifications for a user
exports.getNotifications = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const notifications = await Notification.find({ user_id }).sort({ created_at: -1 });
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
