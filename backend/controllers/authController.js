
const OTP = require('../models/OTP');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
// Google/Apple Login
exports.socialLogin = async (req, res) => {
  const { provider, id_token } = req.body;
  if (!provider || !id_token) return res.status(400).json({ message: 'Provider and id_token required' });

  let payload;
  if (provider === 'google') {
    try {
      const ticket = await googleClient.verifyIdToken({ idToken: id_token, audience: GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid Google token' });
    }
  } else if (provider === 'apple') {
    // Apple Sign-In token verification should be implemented here (requires additional setup)
    return res.status(501).json({ message: 'Apple login not implemented yet' });
  } else {
    return res.status(400).json({ message: 'Unsupported provider' });
  }

  // Find or create user
  let user = await User.findOne({ provider: provider, provider_id: payload.sub });
  if (!user) {
    user = await User.create({
      name: payload.name || payload.email,
      email: payload.email,
      provider: provider,
      provider_id: payload.sub,
      is_verified: true
    });
  }

  const token = jwt.sign({ user_id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ message: 'Login success', token, user });
};

exports.sendOTP = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone number is required' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await OTP.create({
    phone,
    otp,
    expires_at: new Date(Date.now() + 5 * 60 * 1000)
  });

  // Always return the OTP in development or for easy testing
  res.json({ message: 'OTP sent', otp });
};

exports.verifyOTP = async (req, res) => {
  const { phone, otp, email, password } = req.body;
  if (!phone || !otp) return res.status(400).json({ message: 'Phone and OTP are required' });

  const record = await OTP.findOne({ phone, otp });
  if (!record || record.expires_at < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  let user;
  if (email && password) {
    // Manual Login Flow: verify email, password AND phone
    user = await User.findOne({ email });
    if (!user || !user.password) return res.status(400).json({ message: 'Invalid email or password' });
    
    const bcrypt = require('bcryptjs');
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid email or password' });
    
    // Check if phone matches the one stored in DB for this email
    if (user.phone !== phone) {
      return res.status(400).json({ message: 'Phone number does not match registered account' });
    }
  } else {
    // Social Login or Phone-only flow
    user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone, is_verified: true });
    }
  }

  user.is_verified = true;
  await user.save();

  await OTP.deleteMany({ phone });

  const token = jwt.sign({ user_id: user._id, email: user.email, phone: user.phone, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ message: 'Login success', token, user });
};
