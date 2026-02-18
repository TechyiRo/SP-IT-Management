const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const WorkLog = require('../models/WorkLog');

// @route   POST api/work
// @desc    Add work log
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const newItem = new WorkLog({
            ...req.body,
            employee: req.user.id,
            date: new Date()
        });
        const log = await newItem.save();
        res.json(log);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: err.message, error: err });
    }
});

// @route   GET api/work/me
// @desc    Get my work logs
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const logs = await WorkLog.find({ employee: req.user.id })
            .populate('company', 'name type')
            .sort({ date: -1 });
        res.json(logs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/work
// @desc    Get all work logs (Admin)
// @access  Private (Admin)
router.get('/', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });
    try {
        const logs = await WorkLog.find().populate('employee', 'fullName').sort({ date: -1 });
        res.json(logs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
