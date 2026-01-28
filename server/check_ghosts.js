const mongoose = require('mongoose');
require('dotenv').config();
const Attendance = require('./models/Attendance');

const checkInvalidRecords = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Find records where employee is null or not a valid objectId (though schema enforces type, it might be logically null)
        const invalidRecords = await Attendance.find({ employee: null });
        console.log(`Found ${invalidRecords.length} records with null employee.`);

        if (invalidRecords.length > 0) {
            console.log('Sample invalid record:', invalidRecords[0]);
        }

        // Also check for records where employee ID exists but user doesn't (orphaned)
        // This is harder to check in one query without aggregate, but let's start with nulls.

        process.exit();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

checkInvalidRecords();
