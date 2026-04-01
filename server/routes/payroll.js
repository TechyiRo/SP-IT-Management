const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');
const { calculatePayrollData } = require('../services/payrollService');

// @route   GET api/payroll/breakdown/:userId
router.get('/breakdown/:userId', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.id !== req.params.userId) {
            return res.status(403).json({ msg: 'Access denied' });
        }
        const { month, year } = req.query;
        if (!month || !year) return res.status(400).json({ msg: 'Month and year required' });

        const data = await calculatePayrollData(req.params.userId, parseInt(month), parseInt(year));
        res.json(data);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/payroll/generate
// @desc    Draft or Update Salary Slip
router.post('/generate', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });
    const { userId, month, year, bonus, deductions, status = 'Draft' } = req.body;

    try {
        const data = await calculatePayrollData(userId, parseInt(month), parseInt(year));
        const baseSalary = data.user.baseSalary;
        const earnedAmount = data.summary.netSalary;
        const finalBonus = parseFloat(bonus) || 0;
        const finalDeductions = parseFloat(deductions) || 0;
        const netSalary = Math.round(earnedAmount + finalBonus - finalDeductions);

        let payroll = await Payroll.findOne({ employee: userId, month, year });

        if (payroll) {
            payroll.baseSalary = baseSalary;
            payroll.hourlyRate = Math.round(data.summary.dailyRate / 8);
            payroll.totalHours = data.summary.totalHours;
            payroll.presentDays = data.summary.presentDays;
            payroll.totalDays = data.summary.totalDays;
            payroll.calculatedWithHours = earnedAmount;
            payroll.bonus = finalBonus;
            payroll.deductions = finalDeductions;
            payroll.netSalary = netSalary;
            payroll.status = status;
            payroll.generatedAt = Date.now();
        } else {
            payroll = new Payroll({
                employee: userId, month, year, baseSalary,
                hourlyRate: Math.round(data.summary.dailyRate / 8),
                totalDays: data.summary.totalDays,
                presentDays: data.summary.presentDays,
                totalHours: data.summary.totalHours,
                calculatedWithHours: earnedAmount,
                bonus: finalBonus, deductions: finalDeductions,
                netSalary, status, generatedBy: req.user.id
            });
        }

        await payroll.save();
        res.json(payroll);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/payroll/admin/all-status
router.get('/admin/all-status', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });
    const { month, year } = req.query;
    try {
        const payrolls = await Payroll.find({ month, year });
        res.json(payrolls);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   POST api/payroll/finalize-all
router.post('/finalize-all', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });
    const { month, year } = req.body;
    try {
        await Payroll.updateMany({ month, year, status: 'Draft' }, { status: 'Finalized', paymentDate: new Date() });
        res.json({ msg: 'All draft payrolls finalized' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET api/payroll/status/:userId
router.get('/status/:userId', auth, async (req, res) => {
    try {
        const { month, year } = req.query;
        const payroll = await Payroll.findOne({ employee: req.params.userId, month, year });
        if (!payroll) return res.json(null);
        
        // Employees only see Finalized or Paid
        if (req.user.role !== 'admin' && payroll.status === 'Draft') {
             return res.json(null);
        }
        res.json(payroll);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
