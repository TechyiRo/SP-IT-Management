const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// @route   POST api/attendance/check-in
// @desc    Request Check-In
// @access  Private (Employee)
router.post('/check-in', auth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let attendance = await Attendance.findOne({
            employee: req.user.id,
            date: today
        });

        if (attendance) {
            // If already present, deny? Or allow update if rejected?
            if (attendance.checkIn.status === 'Approved') {
                return res.status(400).json({ msg: 'Already checked in today' });
            }
            // If pending, maybe just return success "Request already pending"
            if (attendance.checkIn.status === 'Pending') {
                return res.status(400).json({ msg: 'Check-In request already pending' });
            }
            // If rejected, maybe allow re-request? For now, create new or update. 
            // Let's assume re-request updates the existing doc.
            attendance.checkIn = {
                time: new Date(),
                status: 'Pending',
                remarks: req.body.remarks
            };
            attendance.status = 'Pending Check-In';
        } else {
            attendance = new Attendance({
                employee: req.user.id,
                date: today,
                checkIn: {
                    time: new Date(),
                    status: 'Pending',
                    remarks: req.body.remarks
                },
                location: req.body.location,
                status: 'Pending Check-In'
            });
        }

        await attendance.save();
        res.json(attendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/attendance/check-out
// @desc    Request Check-Out
// @access  Private (Employee)
router.post('/check-out', auth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let attendance = await Attendance.findOne({
            employee: req.user.id,
            date: today
        });

        if (!attendance || attendance.checkIn.status !== 'Approved') {
            return res.status(400).json({
                msg: 'You must be checked in first',
                debug: {
                    serverDate: today,
                    found: !!attendance,
                    checkInStatus: attendance?.checkIn?.status,
                    recordDate: attendance?.date
                }
            });
        }

        if (attendance.checkOut.status === 'Approved') {
            return res.status(400).json({ msg: 'Already checked out' });
        }

        if (attendance.checkOut.status === 'Pending') {
            return res.status(400).json({ msg: 'Check-Out request already pending' });
        }

        attendance.checkOut = {
            time: new Date(),
            status: 'Pending',
            remarks: req.body.remarks
        };
        attendance.status = 'Pending Check-Out';

        await attendance.save();
        res.json(attendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/attendance/half-day
// @desc    Request Half-Day
// @access  Private (Employee)
router.post('/half-day', [auth, require('multer')({ dest: 'uploads/leaves' }).single('attachment')], async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let attendance = await Attendance.findOne({
            employee: req.user.id,
            date: today
        });

        // Config for half day
        const halfDayData = {
            isRequested: true,
            type: req.body.type || 'First Half',
            reason: req.body.reason,
            attachment: req.file ? req.file.path : null,
            status: 'Pending'
        };

        if (attendance) {
            attendance.halfDay = halfDayData;
            attendance.status = 'Pending Half-Day'; // Override status?
        } else {
            attendance = new Attendance({
                employee: req.user.id,
                date: today,
                halfDay: halfDayData,
                status: 'Pending Half-Day' // Initially pending
            });
        }

        await attendance.save();
        res.json(attendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/attendance/leave
// @desc    Request Full Day Leave
// @access  Private (Employee)
router.post('/leave', [auth, require('multer')({ dest: 'uploads/leaves' }).single('attachment')], async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let attendance = await Attendance.findOne({
            employee: req.user.id,
            date: today
        });

        // Config for leave
        const leaveData = {
            isRequested: true,
            reason: req.body.reason,
            attachment: req.file ? req.file.path : null,
            status: 'Pending'
        };

        if (attendance) {
            attendance.leave = leaveData;
            attendance.status = 'Pending Leave';
        } else {
            attendance = new Attendance({
                employee: req.user.id,
                date: today,
                leave: leaveData,
                status: 'Pending Leave'
            });
        }

        await attendance.save();
        res.json(attendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: err.message, stack: err.stack });
    }
});

// @route   PUT api/attendance/:id/action
// @desc    Admin Action (Approve/Reject)
// @access  Private (Admin)
router.put('/:id/action', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });

    try {
        let attendance = await Attendance.findById(req.params.id);
        if (!attendance) return res.status(404).json({ msg: 'Record not found' });

        const { action, remarks } = req.body;

        if (action === 'approve_checkin') {
            attendance.checkIn.status = 'Approved';
            attendance.status = 'Present';
        } else if (action === 'reject_checkin') {
            attendance.checkIn.status = 'Rejected';
            attendance.status = 'Rejected';
        } else if (action === 'approve_checkout') {
            attendance.checkOut.status = 'Approved';

            if (attendance.checkIn.time && attendance.checkOut.time) {
                const diff = Math.abs(new Date(attendance.checkOut.time) - new Date(attendance.checkIn.time));
                attendance.duration = Math.floor((diff / 1000) / 60);

                // ≤ 4 hours (240 min) → Half Day
                if (attendance.duration <= 240) {
                    attendance.status = 'Half Day';
                }
                // > 8 hours (480 min) → Over Work
                else if (attendance.duration > 480) {
                    attendance.status = 'Over Work';
                }
                // 4–8 hours → Normal day
                else {
                    attendance.status = 'Checked-Out';
                }
            } else {
                attendance.status = 'Checked-Out';
            }

            // Auto-approve overtime if requested during checkout approval
            if (attendance.overtimeRequest && attendance.overtimeRequest.isRequested && attendance.overtimeRequest.status === 'Pending') {
                attendance.overtimeRequest.status = 'Approved';
            }
        } else if (action === 'reject_checkout') {
            attendance.checkOut.status = 'Rejected';
            attendance.status = 'Present';

            // Reject any pending overtime requests as well
            if (attendance.overtimeRequest && attendance.overtimeRequest.isRequested && attendance.overtimeRequest.status === 'Pending') {
                attendance.overtimeRequest.status = 'Rejected';
            }
        } else if (action === 'approve_halfday') {
            attendance.halfDay.status = 'Approved';
            attendance.status = 'Half Day';
            attendance.duration = 4 * 60; // Fixed 4 hours
        } else if (action === 'reject_halfday') {
            attendance.halfDay.status = 'Rejected';
            attendance.status = attendance.checkIn.status === 'Approved' ? 'Present' : 'Absent';
        } else if (action === 'approve_leave') {
            attendance.leave.status = 'Approved';
            attendance.status = 'On Leave';
            attendance.duration = 0;
        } else if (action === 'reject_leave') {
            attendance.leave.status = 'Rejected';
            attendance.status = 'Absent';
        }

        if (remarks) attendance.adminRemarks = remarks;

        attendance.actionLog.push({
            action: action,
            admin: req.user.id
        });

        console.log(`[Admin Action] Processing ${action} for attendance ${attendance._id}`);
        console.log(`[Before Save] Status: ${attendance.status}, Leave Status: ${attendance.leave?.status}`);

        await attendance.save();

        console.log(`[After Save] Status: ${attendance.status}, Leave Status: ${attendance.leave?.status}`);
        res.json(attendance);

    } catch (err) {
        console.error(err.message);
        console.error(err); // Log full error
        res.status(500).send('Server Error');
    }
});

// @route   GET api/attendance/me
// @desc    Get my attendance
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const attendance = await Attendance.find({ employee: req.user.id }).sort({ date: -1 });
        res.json(attendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/attendance
// @desc    Get all attendance (Admin)
// @access  Private (Admin)
router.get('/', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });
    try {
        const attendance = await Attendance.find().populate('employee', ['fullName', 'username', 'employeeId']).sort({ date: -1 });
        res.json(attendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/attendance/:id
// @desc    Update attendance record (Admin Manual Edit)
// @access  Private (Admin)
router.put('/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });

    try {
        let attendance = await Attendance.findById(req.params.id);
        if (!attendance) return res.status(404).json({ msg: 'Record not found' });

        const { status, checkInTime, checkOutTime, remarks } = req.body;

        if (status) attendance.status = status;

        if (checkInTime) {
            attendance.checkIn.time = checkInTime;
            attendance.checkIn.status = 'Approved'; // Assume manual edit means approved
        }

        if (checkOutTime) {
            attendance.checkOut.time = checkOutTime;
            attendance.checkOut.status = 'Approved';
        }

        if (remarks) attendance.adminRemarks = remarks;

        // Recalculate duration if both exists
        if (attendance.checkIn.time && attendance.checkOut.time) {
            const diff = Math.abs(new Date(attendance.checkOut.time) - new Date(attendance.checkIn.time));
            attendance.duration = Math.floor((diff / 1000) / 60);
        }

        attendance.actionLog.push({
            action: 'Manual Update',
            admin: req.user.id
        });

        await attendance.save();
        res.json(attendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/attendance/:id
// @desc    Delete attendance record
// @access  Private (Admin)
router.delete('/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });

    try {
        const attendance = await Attendance.findById(req.params.id);
        if (!attendance) return res.status(404).json({ msg: 'Record not found' });

        await attendance.deleteOne();
        res.json({ msg: 'Attendance record removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/attendance/forgot-checkout/:id
// @desc    Submit forgotten checkout and overtime request
// @access  Private (Employee)
router.post('/forgot-checkout/:id', auth, async (req, res) => {
    try {
        let attendance = await Attendance.findOne({ _id: req.params.id, employee: req.user.id });
        if (!attendance || !attendance.forgotCheckOut) {
            return res.status(404).json({ msg: 'No forgotten checkout record found' });
        }

        const { checkOutTime, overtimeMinutes, reason } = req.body;

        if (!checkOutTime) {
            return res.status(400).json({ msg: 'Check-out time is required' });
        }

        attendance.checkOut = {
            time: new Date(checkOutTime),
            status: 'Pending',
            remarks: reason
        };

        if (overtimeMinutes && overtimeMinutes > 0) {
            attendance.overtimeRequest = {
                isRequested: true,
                minutes: overtimeMinutes,
                reason: reason,
                status: 'Pending'
            };
        }

        attendance.status = 'Pending Check-Out';
        attendance.forgotCheckOut = false; // Resolved the forgot state, back to pending
        await attendance.save();

        res.json(attendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ─────────────────────────────────────────────────────────────
// @route   POST api/attendance/mark-absents
// @desc    Admin: Manually mark absents for a specific date
//          Body: { date: "YYYY-MM-DD" }  (defaults to today)
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────
router.post('/mark-absents', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });

    try {
        const { markAbsentsForDate } = require('../services/cronService');

        const targetDate = req.body.date ? new Date(req.body.date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const result = await markAbsentsForDate(targetDate);
        res.json({
            msg: `Absent check complete for ${targetDate.toDateString()}`,
            absent: result.absent,
            forgotCheckOut: result.forgotCheckOut,
            totalEmployees: result.totalEmployees
        });
    } catch (err) {
        console.error('[mark-absents]', err.message);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// @route   POST api/attendance/backfill-absents
// @desc    Admin: Backfill absent records for past N days
//          Body: { days: 30 }  (defaults to 30)
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────
router.post('/backfill-absents', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });

    try {
        const { markAbsentsForDate } = require('../services/cronService');
        const days = parseInt(req.body.days) || 30;

        let totalAbsent = 0;
        let totalForgot = 0;
        const log = [];

        for (let i = 1; i <= days; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);

            const result = await markAbsentsForDate(d);
            totalAbsent += result.absent;
            totalForgot += result.forgotCheckOut;
            if (result.absent > 0 || result.forgotCheckOut > 0) {
                log.push({ date: d.toDateString(), absent: result.absent, forgotCheckOut: result.forgotCheckOut });
            }
        }

        res.json({
            msg: `Backfill complete for past ${days} days`,
            totalAbsent,
            totalForgotCheckOut: totalForgot,
            details: log
        });
    } catch (err) {
        console.error('[backfill-absents]', err.message);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

module.exports = router;
