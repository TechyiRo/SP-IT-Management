const cron = require('node-cron');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

/**
 * markAbsentsForDate
 * Core logic: for a given date, mark all active employees who didn't check-in as Absent.
 * Also handles Forgot Check-Out for employees who checked in but not out.
 *
 * @param {Date} targetDate - midnight-normalized date to process
 * @returns {Object} { absent: number, forgotCheckOut: number }
 */
const markAbsentsForDate = async (targetDate) => {
    const date = new Date(targetDate);
    date.setHours(0, 0, 0, 0);

    const employees = await User.find({ role: 'employee', status: 'active' });
    let absentCount = 0;
    let forgotCount = 0;

    for (const employee of employees) {
        const attendance = await Attendance.findOne({ employee: employee._id, date });

        if (!attendance) {
            // No record at all → Create Absent
            try {
                await Attendance.create({
                    employee: employee._id,
                    date,
                    status: 'Absent'
                });
                absentCount++;
            } catch (err) {
                // Duplicate key: record already exists (race condition), skip
                if (err.code !== 11000) throw err;
            }

        } else if (
            attendance.checkIn?.status === 'Approved' &&
            attendance.checkOut?.status !== 'Approved'
        ) {
            // Checked in but didn't check out → Forgot Check-Out
            if (!attendance.forgotCheckOut) {
                attendance.forgotCheckOut = true;
                attendance.status = 'Forgot Check-Out';
                await attendance.save();
                forgotCount++;

                const Notification = require('../models/Notification');
                await Notification.create({
                    recipient: employee._id,
                    message: `You forgot to Check-out on ${date.toLocaleDateString('en-IN')}. Please update your checkout time.`,
                    type: 'general',
                    relatedId: attendance._id,
                    onModel: 'Attendance'
                });
            }

        } else if (!attendance.checkIn || attendance.checkIn.status !== 'Approved') {
            // Has a record but check-in was never approved (rejected / pending at end of day)
            const hasApprovedLeave    = attendance.leave?.isRequested    && attendance.leave?.status    === 'Approved';
            const hasApprovedHalfDay  = attendance.halfDay?.isRequested  && attendance.halfDay?.status  === 'Approved';

            if (!hasApprovedLeave && !hasApprovedHalfDay && attendance.status !== 'Absent') {
                attendance.status = 'Absent';
                await attendance.save();
                absentCount++;
            }
        }
    }

    return { absent: absentCount, forgotCheckOut: forgotCount, totalEmployees: employees.length };
};

const initializeCronJobs = () => {
    // Run every day at 11:50 PM IST
    cron.schedule('50 23 * * *', async () => {
        console.log('[Cron] Running daily attendance check...');
        try {
            const today = new Date();
            const result = await markAbsentsForDate(today);
            console.log(`[Cron] Done. Absent: ${result.absent}, Forgot Checkout: ${result.forgotCheckOut}`);
        } catch (error) {
            console.error('[Cron] Error:', error);
        }
    }, {
        scheduled: true,
        timezone: 'Asia/Kolkata'
    });
};

module.exports = { initializeCronJobs, markAbsentsForDate };
