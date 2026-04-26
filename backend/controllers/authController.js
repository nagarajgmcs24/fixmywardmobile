
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

exports.checkGoogle = async (req, res) => {
  const { email, google_id, name } = req.body;
  if (!email || !google_id) return res.status(400).json({ message: 'Email and Google ID are required' });

  // Find user by email or provider_id
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.findOne({ provider_id: google_id });
  }

  if (user && user.phone) {
    // User exists and has a phone number, login directly
    user.provider = 'google';
    user.provider_id = google_id;
    if (!user.name) user.name = name;
    await user.save();
    const token = jwt.sign({ user_id: user._id, email: user.email, phone: user.phone, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ message: 'Login success', token, user });
  }

  // User doesn't exist or needs to link phone
  return res.json({ requirePhone: true });
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
  try {
    const { phone, otp, email, password, google_id, name } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: 'Phone and OTP are required' });

    const record = await OTP.findOne({ phone, otp });
    if (!record || record.expires_at < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    let user;
    if (email && password) {
      user = await User.findOne({ email });
      const bcrypt = require('bcryptjs');

      if (!user) {
        // Register a new user with email/password and OTP-verified phone
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await User.create({
          name: req.body.name,
          email,
          phone,
          password: hashedPassword,
          ward_id: req.body.ward_id,
          is_verified: true,
        });
      } else {
        if (!user.password) return res.status(400).json({ message: 'Invalid email or password' });
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: 'Invalid email or password' });

        if (user.phone && user.phone !== phone) {
          return res.status(400).json({ message: 'Phone number does not match registered account' });
        }
        if (!user.phone) {
          user.phone = phone;
        }
      }
    } else if (google_id || email) {
      // Google Login flow with phone OTP verification
      user = await User.findOne({ email });
      if (!user) {
         user = await User.findOne({ phone });
         if (user && user.email && user.email !== email) {
            return res.status(400).json({ message: 'Phone number already registered with a different account' });
         }
         if (!user) {
             user = await User.create({
               name: name || '',
               email,
               phone,
               provider: 'google',
               provider_id: google_id,
               is_verified: true,
             });
         } else {
             user.name = user.name || name;
             user.email = email;
             user.provider = 'google';
             user.provider_id = google_id;
             await user.save();
         }
      } else {
         if (user.phone && user.phone !== phone) {
             // Allow updating phone or syncing Google account to existing phone
         }
         user.phone = phone;
         user.provider = 'google';
         user.provider_id = google_id;
         user.name = user.name || name;
         await user.save();
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
    console.log('OTP Verification Success:', { phone, email, user_id: user._id });
    res.json({ message: 'Login success', token, user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, provider: user.provider } });
  } catch (error) {
    console.error('OTP Verification Error:', error);
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
};
