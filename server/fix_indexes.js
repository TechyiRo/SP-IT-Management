const mongoose = require('mongoose');
require('dotenv').config();

const fixIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const collection = mongoose.connection.collection('attendances');

        // List indexes to confirm
        const indexes = await collection.indexes();
        console.log('Current Indexes:', indexes);

        const badIndex = indexes.find(i => i.name === 'user_1_date_1');

        if (badIndex) {
            console.log('Found bad index: user_1_date_1. Dropping...');
            await collection.dropIndex('user_1_date_1');
            console.log('Successfully dropped user_1_date_1');
        } else {
            console.log('Index user_1_date_1 not found.');
        }

        console.log('Done.');
        process.exit();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

fixIndexes();
