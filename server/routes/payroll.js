const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

// @route   GET api/payroll/breakdown/:userId
// @desc    Get detailed daily salary breakdown
// @access  Private (Admin/Self)
router.get('/breakdown/:userId', auth, async (req, res) => {
    try {
        // Auth check: Admin or Self
        if (req.user.role !== 'admin' && req.user.id !== req.params.userId) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { month, year } = req.query; // e.g. "01", "2026"

        if (!month || !year) {
            return res.status(400).json({ msg: 'Please provide month (1-12) and year.' });
        }

        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const baseSalary = user.baseSalary || 0;

        // Calculation Constants
        const STANDARD_DAYS = 30;
        const STANDARD_HOURS = 8;
        const hourlyRate = (baseSalary / STANDARD_DAYS) / STANDARD_HOURS;

        // Fetch Attendance for that month range
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of month

        const records = await Attendance.find({
            employee: req.params.userId,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });

        let totalPay = 0;
        let totalHours = 0;
        let presentDays = 0;

        const breakdown = records.map(record => {
            let hours = 0;
            let dailyPay = 0;

            // Determine hours based on duration or status
            // Note: duration is in minutes in Attendance model
            if (record.duration > 0) {
                hours = Math.round((record.duration / 60) * 100) / 100; // Round to 2 decimals
            } else if (record.status === 'Present') {
                // Fallback if checked-in but not out? Or manual Present?
                // If manual 'Present' without duration, assume 8 hrs? 
                // Let's assume duration is the source of truth if it exists, else 0 or manual policy.
                // For now, if duration is 0 but status is 'Present', let's NOT pay to force Checkout.
                // Or user 'Manual Update' handles duration.
                hours = 0;
            } else if (record.status === 'Half Day') {
                hours = 4;
            } else if (record.status === 'Holiday') {
                hours = 8; // Paid Holiday
            }

            // Cap at 8 hours? Or allow overtime? 
            // User requested "6h 30m vs 8h", so usually cap at 8 for standard pay, or pay specific.
            // Let's pay purely based on duration for now (Linear).
            dailyPay = Math.round(hours * hourlyRate);

            if (hours > 0) {
                totalHours += hours;
                totalPay += dailyPay;
                presentDays++;
            }

            return {
                date: record.date,
                status: record.status,
                checkIn: record.checkIn?.time,
                checkOut: record.checkOut?.time,
                hours: hours,
                dailyPay: dailyPay
            };
        });

        // Include "Total" summary
        res.json({
            user: {
                id: user._id,
                name: user.fullName,
                baseSalary: baseSalary,
                hourlyRate: hourlyRate.toFixed(2)
            },
            summary: {
                totalDays: STANDARD_DAYS,
                presentDays,
                totalHours: totalHours.toFixed(2),
                totalPay,
                netSalary: totalPay // Deductions can be added later
            },
            breakdown
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

const Payroll = require('../models/Payroll');

// ... (Existing breakdown route)

// @route   POST api/payroll/generate
// @desc    Finalize and Save Salary Slip
// @access  Private (Admin)
router.post('/generate', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });

    const { userId, month, year, bonus, deductions, note } = req.body; // bonus/deductions optional manual overrides

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // 1. Perform Calculation (Same logic as breakdown)
        const baseSalary = user.baseSalary || 0;
        const STANDARD_DAYS = 30;
        const STANDARD_HOURS = 8;
        const hourlyRate = (baseSalary / STANDARD_DAYS) / STANDARD_HOURS;

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const records = await Attendance.find({
            employee: userId,
            date: { $gte: startDate, $lte: endDate }
        });

        let totalHours = 0;
        let presentDays = 0;

        records.forEach(record => {
            let hours = 0;
            if (record.duration > 0) hours = record.duration / 60;
            else if (record.status === 'Present') hours = 0; // Or 8 if policy changes
            else if (record.status === 'Half Day') hours = 4;
            else if (record.status === 'Holiday') hours = 8;

            if (hours > 0) {
                totalHours += hours;
                presentDays++;
            }
        });

        // 2. Financials
        const earnedAmount = Math.round(totalHours * hourlyRate);
        const finalBonus = parseFloat(bonus) || 0;
        const finalDeductions = parseFloat(deductions) || 0;

        const netSalary = earnedAmount + finalBonus - finalDeductions;

        // 3. Upsert Payroll Record
        let payroll = await Payroll.findOne({ employee: userId, month, year });

        if (payroll) {
            // Update existing
            payroll.baseSalary = baseSalary;
            payroll.hourlyRate = hourlyRate;
            payroll.totalHours = totalHours;
            payroll.presentDays = presentDays;
            payroll.calculatedWithHours = earnedAmount;
            payroll.bonus = finalBonus;
            payroll.deductions = finalDeductions;
            payroll.netSalary = netSalary;
            payroll.generatedAt = Date.now();
        } else {
            // Create new
            payroll = new Payroll({
                employee: userId,
                month,
                year,
                baseSalary,
                hourlyRate,
                totalDays: STANDARD_DAYS,
                presentDays,
                totalHours,
                calculatedWithHours: earnedAmount,
                bonus: finalBonus,
                deductions: finalDeductions,
                netSalary,
                generatedBy: req.user.id
            });
        }

        await payroll.save();
        res.json(payroll);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/payroll/status/:userId
// @desc    Get generated payroll for specific month
router.get('/status/:userId', auth, async (req, res) => {
    try {
        const { month, year } = req.query;
        const payroll = await Payroll.findOne({ employee: req.params.userId, month, year });
        res.json(payroll); // Returns null if not generated yet
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
