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
            attendance.status = 'Checked-Out';

            if (attendance.checkIn.time && attendance.checkOut.time) {
                const diff = Math.abs(new Date(attendance.checkOut.time) - new Date(attendance.checkIn.time));
                attendance.duration = Math.floor((diff / 1000) / 60);
            }

        } else if (action === 'reject_checkout') {
            attendance.checkOut.status = 'Rejected';
            attendance.status = 'Present';
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

module.exports = router;
