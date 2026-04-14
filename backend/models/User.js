const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String }, // hashed password (optional)
  provider: { type: String, default: 'otp' }, // 'otp', 'google', 'apple'
  provider_id: { type: String, default: null },
  role: { type: String, default: 'citizen' },
  ward_id: String,
  is_verified: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
