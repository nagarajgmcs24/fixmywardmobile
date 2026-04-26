const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();
const connectDB = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.json());

// Connect to MongoDB
connectDB();

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}
app.use('/uploads', express.static('uploads'));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Fix My Ward Backend API is running' });
});

// Import and use routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/wards', require('./routes/wards'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
app.post('/send-otp', async (req, res) => {
  const { phone } = req.body;

  try {
    const response = await axios.get(
      `https://control.msg91.com/api/v5/otp?authkey=504854AwvBTUotST69cbdfbcP1&mobile=91${phone}&template_id=69cbdbc6748667ec730c20a5`
    );

    console.log(response.data);

    res.send({ success: true, message: "OTP sent" });

  } catch (error) {
    console.log(error.response?.data || error.message);
    res.send({ success: false, message: "Error sending OTP" });
  }
});
