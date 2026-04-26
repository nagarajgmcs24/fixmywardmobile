const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';

// Check if email exists
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });
    const user = await User.findOne({ email });
    if (user) {
      if (user.role === 'councillor') {
        return res.status(403).json({ message: 'This email is reserved for councillors and is not accessible for citizen registration.' });
      }
      return res.status(400).json({ message: 'Email already registered' });
    }
    res.json({ message: 'Email available' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Register with password
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.role === 'councillor') {
        return res.status(403).json({ message: 'This email is reserved for councillors and is not accessible for citizen registration.' });
      }
      return res.status(400).json({ message: 'Email already registered' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, phone, password: hash, role: 'citizen', is_verified: true });
    const token = jwt.sign({ user_id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Registered', token, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Login with password
exports.login = async (req, res) => {
  try {
    const { email, password, phone, ward_id } = req.body;
    console.log('Login attempt:', { email, phone, ward_id });
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and Password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      console.log('User not found or no password');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log('Password mismatch');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update phone and ward_id if provided and not already stored
    let changed = false;
    if (phone && !user.phone) { user.phone = phone; changed = true; }
    if (ward_id && !user.ward_id) { user.ward_id = String(ward_id); changed = true; }
    if (changed) await user.save();

    const token = jwt.sign({ user_id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login success', token, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    console.log('Deleting account for user:', user_id);
    await User.findByIdAndDelete(user_id);
    res.json({ message: 'Account deleted' });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { oldPassword, newPassword } = req.body;
    console.log('Changing password for user:', userId);
    if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Old and new password required' });
    const user = await User.findById(userId);
    if (!user || !user.password) return res.status(404).json({ message: 'User not found' });
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(401).json({ message: 'Incorrect old password' });
    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
