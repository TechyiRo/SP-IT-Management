const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Task = require('../models/Task');

// @route   GET api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private (Admin)
router.get('/stats', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied' });
    }

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Total Employees
        const totalEmployees = await User.countDocuments({ role: 'employee' });

        // 2. Present Today (Simple count of records for today where status indicates presence)
        // Adjust statuses based on your exact enum values in Attendance.js
        const attendanceToday = await Attendance.find({ date: today });
        const presentToday = attendanceToday.filter(a =>
            ['Present', 'Half Day', 'Checked-Out'].includes(a.status) ||
            (a.checkIn && a.checkIn.status === 'Approved')
        ).length;

        // 3. Active Tasks (Not Completed/Resolved/Cancelled)
        const activeTasks = await Task.countDocuments({
            status: { $nin: ['Completed', 'Resolved', 'Cancelled'] }
        });

        // 4. Pending Requests (Aggregation of all pending actions)
        // We can query attendance records that have ANY pending status
        // 4. Pending Requests (Strict Aggregation)
        // Only count valid requests (ignoring ghost defaults)
        const pendingAttendance = await Attendance.countDocuments({
            $or: [
                { 'checkIn.status': 'Pending' },
                // CheckOut is pending ONLY if time is present
                { 'checkOut.status': 'Pending', 'checkOut.time': { $exists: true } },
                // HalfDay is pending ONLY if explicitly requested
                { 'halfDay.status': 'Pending', 'halfDay.isRequested': true },
                // Leave is pending ONLY if explicitly requested
                { 'leave.status': 'Pending', 'leave.isRequested': true }
            ]
        });

        // 5. Recent Activity (New Users for now, or maybe recent tasks?)
        // Let's fetch recent tasks as activity
        const recentTasks = await Task.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('assignedTo', 'fullName')
            .select('title status createdAt assignedTo');

        // 6. Chart Data (Last 7 Days Attendance)
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            days.push(d);
        }

        const chartData = await Promise.all(days.map(async (day) => {
            const nextDay = new Date(day);
            nextDay.setDate(day.getDate() + 1);

            const attCount = await Attendance.countDocuments({
                date: day,
                status: { $in: ['Present', 'Half Day', 'Checked-Out'] }
            });

            const taskCount = await Task.countDocuments({
                createdAt: { $gte: day, $lt: nextDay }
            });

            return {
                name: day.toLocaleDateString('en-US', { weekday: 'short' }),
                attendance: attCount,
                tasks: taskCount
            };
        }));

        res.json({
            totalEmployees,
            presentToday,
            activeTasks,
            pendingRequests: pendingAttendance,
            recentActivity: recentTasks,
            chartData
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
