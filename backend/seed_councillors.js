const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');

const WARDS = [
  { ward_id: '1', name: 'Indiranagar' },
  { ward_id: '2', name: 'Koramangala' },
  { ward_id: '3', name: 'HSR Layout' },
  { ward_id: '4', name: 'Whitefield' },
  { ward_id: '5', name: 'Marathahalli' },
  { ward_id: '6', name: 'Jayanagar' },
  { ward_id: '7', name: 'JP Nagar' },
  { ward_id: '8', name: 'Electronic City' },
];

async function seedCouncillors() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const password = 'password123';
        const hash = await bcrypt.hash(password, 10);

        for (const ward of WARDS) {
            const email = `councillor${ward.ward_id}@test.com`;
            const phone = `900000000${ward.ward_id}`;
            const name = `Councillor ${ward.name}`;

            // Check if exists
            const existing = await User.findOne({ email });
            if (existing) {
                console.log(`Councillor for ${ward.name} already exists, skipping.`);
                continue;
            }

            await User.create({
                name,
                email,
                phone,
                password: hash,
                role: 'councillor',
                ward_id: ward.ward_id,
                is_verified: true
            });
            console.log(`Created councillor for ${ward.name}: ${email} / ${phone}`);
        }

        console.log('Seeding completed.');
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
}

seedCouncillors();
