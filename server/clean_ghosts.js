const mongoose = require('mongoose');
require('dotenv').config();
const Attendance = require('./models/Attendance');

const cleanGhosts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Delete records where employee is null (which captures those with 'user' but no 'employee')
        const result = await Attendance.deleteMany({ employee: null });
        console.log(`Deleted ${result.deletedCount} ghost records.`);

        process.exit();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

cleanGhosts();
