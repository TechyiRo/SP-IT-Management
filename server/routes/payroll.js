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
        const totalDaysInMonth = new Date(year, month, 0).getDate();

        // Count Sundays
        let sundayCount = 0;
        for (let i = 1; i <= totalDaysInMonth; i++) {
            const date = new Date(year, month - 1, i);
            if (date.getDay() === 0) {
                sundayCount++;
            }
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const records = await Attendance.find({
            employee: req.params.userId,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });

        // Count manual holidays (not Sundays)
        const manualHolidays = records.filter(r => r.status === 'Holiday' && new Date(r.date).getDay() !== 0).length;
        const totalHolidays = sundayCount + manualHolidays;
        const workingDaysInMonth = totalDaysInMonth - totalHolidays;
        
        const dailyRate = workingDaysInMonth > 0 ? (baseSalary / workingDaysInMonth) : 0;
        const perMinuteRate = dailyRate / (8 * 60);

        let totalPayCuts = 0;
        let totalOvertimePay = 0;
        let totalHours = 0;
        let presentDays = 0;
        const breakdown = [];

        for (let i = 1; i <= totalDaysInMonth; i++) {
            const currentDate = new Date(year, month - 1, i);
            const isSunday = currentDate.getDay() === 0;
            const record = records.find(r => new Date(r.date).getDate() === i);
            let isHoliday = isSunday || (record && record.status === 'Holiday');

            let dailyEarned = 0;
            let cutAmount = 0;
            let overtimePay = 0;
            let hoursWorked = 0;
            let status = record ? record.status : (isHoliday ? 'Holiday' : 'Absent');

            if (record && record.duration > 0) {
                hoursWorked = record.duration / 60;
                
                if (isHoliday) {
                    // Working on a holiday is pure overtime
                    overtimePay = record.duration * perMinuteRate;
                    dailyEarned = overtimePay;
                    totalOvertimePay += overtimePay;
                    totalHours += hoursWorked;
                    presentDays++;
                } else {
                    if (record.duration >= 480) { // 8 hours or more
                        dailyEarned = dailyRate;
                        totalHours += hoursWorked;
                        presentDays++;
                        
                        // Overtime if > 8 hrs
                        if (record.duration > 480) {
                            const extraMins = record.duration - 480;
                            const extraPay = extraMins * perMinuteRate;
                            overtimePay = extraPay;
                            dailyEarned += extraPay; // Total they earned today
                            totalOvertimePay += extraPay;
                        }
                    } else { // Less than 8 hours
                        const workedPay = record.duration * perMinuteRate;
                        cutAmount = dailyRate - workedPay;
                        dailyEarned = workedPay;
                        totalPayCuts += cutAmount;
                        totalHours += hoursWorked;
                        presentDays++;
                    }
                }
            } else {
                if (!isHoliday) {
                    if (status === 'Half Day') {
                        hoursWorked = 4;
                        const workedPay = (4 * 60) * perMinuteRate;
                        cutAmount = dailyRate - workedPay;
                        dailyEarned = workedPay;
                        totalPayCuts += cutAmount;
                        totalHours += hoursWorked;
                        presentDays += 0.5;
                    } else if (status === 'Absent' || status === 'On Leave' || status.includes('Pending') || status === 'Forgot Check-Out') {
                        cutAmount = dailyRate;
                        totalPayCuts += cutAmount;
                    }
                }
            }

            breakdown.push({
                date: currentDate,
                status: status,
                checkIn: record?.checkIn?.time,
                checkOut: record?.checkOut?.time,
                hours: Math.round(hoursWorked * 100) / 100,
                dailyPay: Math.round(dailyEarned),
                cutAmount: Math.round(cutAmount),
                overtimePay: Math.round(overtimePay)
            });
        }

        const netSalary = Math.round(baseSalary - totalPayCuts + totalOvertimePay);

        res.json({
            user: {
                id: user._id,
                name: user.fullName,
                baseSalary: baseSalary,
            },
            summary: {
                totalDays: totalDaysInMonth,
                workingDays: workingDaysInMonth,
                holidays: totalHolidays,
                presentDays: presentDays,
                totalHours: totalHours.toFixed(2),
                dailyRate: Math.round(dailyRate),
                totalCuts: Math.round(totalPayCuts),
                totalOvertimePay: Math.round(totalOvertimePay),
                netSalary: netSalary
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

    const { userId, month, year, bonus, deductions, note } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Identical core calculation logic to the breakdown
        const baseSalary = user.baseSalary || 0;
        const totalDaysInMonth = new Date(year, month, 0).getDate();

        let sundayCount = 0;
        for (let i = 1; i <= totalDaysInMonth; i++) {
            const date = new Date(year, month - 1, i);
            if (date.getDay() === 0) sundayCount++;
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const records = await Attendance.find({
            employee: userId,
            date: { $gte: startDate, $lte: endDate }
        });

        const manualHolidays = records.filter(r => r.status === 'Holiday' && new Date(r.date).getDay() !== 0).length;
        const totalHolidays = sundayCount + manualHolidays;
        const workingDaysInMonth = totalDaysInMonth - totalHolidays;
        
        const dailyRate = workingDaysInMonth > 0 ? (baseSalary / workingDaysInMonth) : 0;
        const perMinuteRate = dailyRate / (8 * 60);

        let totalPayCuts = 0;
        let totalOvertimePay = 0;
        let totalHours = 0;
        let presentDays = 0;

        for (let i = 1; i <= totalDaysInMonth; i++) {
            const currentDate = new Date(year, month - 1, i);
            const isSunday = currentDate.getDay() === 0;
            const record = records.find(r => new Date(r.date).getDate() === i);
            let isHoliday = isSunday || (record && record.status === 'Holiday');

            let status = record ? record.status : (isHoliday ? 'Holiday' : 'Absent');

            if (record && record.duration > 0) {
                totalHours += record.duration / 60;
                presentDays++;
                
                if (isHoliday) {
                    totalOvertimePay += record.duration * perMinuteRate;
                } else {
                    if (record.duration > 480) {
                        totalOvertimePay += (record.duration - 480) * perMinuteRate;
                    } else if (record.duration < 480) {
                        totalPayCuts += dailyRate - (record.duration * perMinuteRate);
                    }
                }
            } else {
                if (!isHoliday) {
                    if (status === 'Half Day') {
                        totalPayCuts += dailyRate - ((4 * 60) * perMinuteRate);
                        totalHours += 4;
                        presentDays += 0.5;
                    } else if (status === 'Absent' || status === 'On Leave' || status.includes('Pending') || status === 'Forgot Check-Out') {
                        totalPayCuts += dailyRate;
                    }
                }
            }
        }

        const earnedAmount = Math.round(baseSalary - totalPayCuts + totalOvertimePay);
        const finalBonus = parseFloat(bonus) || 0;
        const finalDeductions = parseFloat(deductions) || 0;

        const netSalary = Math.round(earnedAmount + finalBonus - finalDeductions);

        let payroll = await Payroll.findOne({ employee: userId, month, year });

        if (payroll) {
            payroll.baseSalary = baseSalary;
            payroll.hourlyRate = Math.round(dailyRate / 8); // approximate for reference
            payroll.totalHours = totalHours;
            payroll.presentDays = presentDays;
            payroll.totalDays = totalDaysInMonth;
            payroll.calculatedWithHours = earnedAmount;
            payroll.bonus = finalBonus;
            payroll.deductions = finalDeductions;
            payroll.netSalary = netSalary;
            payroll.generatedAt = Date.now();
        } else {
            payroll = new Payroll({
                employee: userId,
                month,
                year,
                baseSalary,
                hourlyRate: Math.round(dailyRate / 8),
                totalDays: totalDaysInMonth,
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
