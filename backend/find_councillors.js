const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();
const User = require('./models/User');

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({ role: 'councillor' }).limit(5);
        console.log('Councillors:', JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
