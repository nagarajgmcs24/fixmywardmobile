const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');

async function createCouncillor() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const hash = await bcrypt.hash('password123', 10);
        const councillor = await User.create({
            name: 'Councillor Indiranagar',
            email: 'councillor1@test.com',
            phone: '7766554433',
            password: hash,
            role: 'councillor',
            ward_id: '1', // Indiranagar
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
