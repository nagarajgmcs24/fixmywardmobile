const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phone: String,
  otp: String,
  expires_at: Date
});

module.exports = mongoose.model('OTP', otpSchema);
