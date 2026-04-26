const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Complaint = require('./models/Complaint');

async function debug() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({});
    console.log(`Total Users: ${users.length}`);
    users.forEach(u => console.log(` - ${u.name} (${u.role}), ID: ${u._id}, Ward: ${u.ward_id}`));

    const complaints = await Complaint.find({});
    console.log(`Total Complaints: ${complaints.length}`);
    complaints.forEach(c => console.log(` - ${c.title}, Status: ${c.status}, User: ${c.user_id}`));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debug();
