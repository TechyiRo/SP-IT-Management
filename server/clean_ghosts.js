const mongoose = require('mongoose');
require('dotenv').config();
const Attendance = require('./models/Attendance');

const cleanGhosts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Delete records where employee is null
        const result = await Attendance.deleteMany({ employee: null });
        console.log(`Deleted ${result.deletedCount} ghost records.`);

        // Fix invalid 'Pending' statuses (Ghost Requests)
        // CheckOut Pending but no timestamp
        const fixCheckOut = await Attendance.updateMany(
            { 'checkOut.status': 'Pending', 'checkOut.time': { $exists: false } },
            { $unset: { 'checkOut.status': "" } }
        );
        console.log(`Fixed ${fixCheckOut.modifiedCount} ghost check-outs.`);

        // HalfDay Pending but no isRequested
        const fixHalfDay = await Attendance.updateMany(
            { 'halfDay.status': 'Pending', 'halfDay.isRequested': false },
            { $unset: { 'halfDay.status': "" } }
        );
        console.log(`Fixed ${fixHalfDay.modifiedCount} ghost half-days.`);

        // Leave Pending but no isRequested
        const fixLeave = await Attendance.updateMany(
            { 'leave.status': 'Pending', 'leave.isRequested': false },
            { $unset: { 'leave.status': "" } }
        );
        console.log(`Fixed ${fixLeave.modifiedCount} ghost leaves.`);

        process.exit();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

cleanGhosts();
