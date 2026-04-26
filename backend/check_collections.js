const mongoose = require('mongoose');
require('dotenv').config();
// No Ward model displayed so far, but wait, the frontend has them. 
// Usually I can just look at the User model's ward_id.

async function checkWards() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        // Let's see if there's a Ward model or if we just use indices 1-8.
        // I'll check common collections.
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkWards();
