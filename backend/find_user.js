const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function findUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ phone: '9876543210' });
        console.log('User found:', JSON.stringify(user, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findUser();
