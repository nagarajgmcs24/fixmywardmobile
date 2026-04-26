const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const WardAssignment = require('./models/WardAssignment');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const wards = [
      { id: '1', name: 'Indiranagar' },
      { id: '2', name: 'Malleshwaram' },
      { id: '3', name: 'Jayanagar' },
      { id: '4', name: 'Koramangala' },
      { id: '5', name: 'Whitefield' },
      { id: '6', name: 'HSR Layout' },
      { id: '7', name: 'Rajajinagar' },
      { id: '8', name: 'Electronic City' }
    ];

    for (const ward of wards) {
      const email = `councillor${ward.id}@fixmyward.com`;
      const phone = `900000000${ward.id}`; // 9000000001, 9000000002, etc.
      
      console.log(`--- Seeding Ward ${ward.id} (${ward.name}) ---`);

      // 1. Create/Update Councillor User
      let councillor = await User.findOne({ $or: [{ email }, { phone }] });
      
      if (!councillor) {
        const hashedPassword = await bcrypt.hash(`password${ward.id}`, 10);
        councillor = await User.create({
          name: `${ward.name} Councillor`,
          email: email,
          phone: phone,
          password: hashedPassword,
          role: 'councillor',
          ward_id: ward.id,
          is_verified: true
        });
        console.log(`  - New councillor created: ${email}`);
      } else {
        councillor.role = 'councillor';
        councillor.ward_id = ward.id;
        councillor.email = email;
        await councillor.save();
        console.log(`  - Existing user updated: ${email}`);
      }

      // 2. Create/Update Ward Assignment
      await WardAssignment.deleteMany({ ward_id: ward.id }); // Clear old assignments for this ward
      await WardAssignment.create({
        ward_id: ward.id,
        user_id: councillor._id
      });
      console.log(`  - Ward ${ward.id} assignment established.`);
    }

    console.log('\nSUCCESS: All 8 wards have been seeded with councillors.');
    process.exit(0);
  } catch (err) {
    console.error('\nERROR during seeding:', err.message);
    process.exit(1);
  }
}

seed();
