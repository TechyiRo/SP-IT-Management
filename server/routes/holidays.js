const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Holiday = require('../models/Holiday');

// @route   GET api/holidays
// @desc    Get all holidays
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const holidays = await Holiday.find().sort({ date: 1 });
        res.json(holidays);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/holidays
// @desc    Add a holiday
// @access  Private (Admin)
router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });
    try {
        const { date, title, description, type } = req.body;
        
        // Normalize date to midnight
        const holidayDate = new Date(date);
        holidayDate.setHours(0, 0, 0, 0);

        let holiday = await Holiday.findOne({ date: holidayDate });
        if (holiday) return res.status(400).json({ msg: 'Holiday already exists for this date' });

        holiday = new Holiday({
            date: holidayDate,
            title,
            description,
            type,
            createdBy: req.user.id
        });

        await holiday.save();
        res.json(holiday);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/holidays/:id
// @desc    Delete a holiday
// @access  Private (Admin)
router.delete('/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });
    try {
        const holiday = await Holiday.findById(req.params.id);
        if (!holiday) return res.status(404).json({ msg: 'Holiday not found' });
        await holiday.deleteOne();
        res.json({ msg: 'Holiday removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
