const cron = require('node-cron');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

const initializeCronJobs = () => {
    // Run every day at 11:50 PM IST
    cron.schedule('50 23 * * *', async () => {
        console.log('[Cron] Running daily attendance check to mark absent employees...');
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Find all active employees
            const employees = await User.find({ role: 'employee', status: 'active' });

            let absentCount = 0;

            for (const employee of employees) {
                // Check if attendance record exists for today
                const attendance = await Attendance.findOne({
                    employee: employee._id,
                    date: today
                });

                if (!attendance) {
                    // Create an absent record
                    const newAttendance = new Attendance({
                        employee: employee._id,
                        date: today,
                        status: 'Absent'
                        // checkIn, checkOut, halfDay, leave will stay undefined or their default values
                    });

                    await newAttendance.save();
                    absentCount++;
                }
            }

            console.log(`[Cron] Daily attendance check completed. Marked ${absentCount} employees as absent.`);
        } catch (error) {
            console.error('[Cron] Error running daily attendance check:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });
};

module.exports = { initializeCronJobs };
