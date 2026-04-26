const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');

async function createCouncillor() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const hash = await bcrypt.hash('password123', 10);
        const councillor = await User.create({
            name: 'Councillor Test',
            email: 'councillor@test.com',
            phone: '9876543210',
            password: hash,
            role: 'councillor',
            ward_id: '2', // Koramangala
            is_verified: true
        });
        console.log('Councillor created:', councillor.email);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

createCouncillor();
