const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const WorkLog = require('../models/WorkLog');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = 'uploads/worklogs';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// @route   POST api/work
// @desc    Add work log
// @access  Private
router.post('/', [auth, upload.array('attachments', 10)], async (req, res) => {
    try {
        let parsedSteps = [];
        if (req.body.steps) {
            try { parsedSteps = JSON.parse(req.body.steps); } catch (e) { console.error('Error parsing steps', e); }
        }

        const attachments = req.files ? req.files.map(file => file.path.replace(/\\/g, '/')) : [];

        const newItem = new WorkLog({
            ...req.body,
            steps: parsedSteps.length ? parsedSteps : [],
            attachments: attachments,
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

// @route   PUT api/work/:id
// @desc    Edit work log
// @access  Private
router.put('/:id', [auth, upload.array('attachments', 10)], async (req, res) => {
    try {
        let log = await WorkLog.findById(req.params.id);
        if (!log) return res.status(404).json({ msg: 'Work log not found' });

        // Ensure user owns the log
        if (log.employee.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        let parsedSteps = [];
        if (req.body.steps) {
            try { parsedSteps = JSON.parse(req.body.steps); } catch (e) { parsedSteps = log.steps; }
        } else {
            parsedSteps = log.steps;
        }

        // Handle existing attachments sent from frontend
        let existingAttachments = [];
        if (req.body.existingAttachments) {
            try {
                const parsedExisting = JSON.parse(req.body.existingAttachments);
                existingAttachments = Array.isArray(parsedExisting) ? parsedExisting : [parsedExisting];
            } catch (e) {
                // Ignore
            }
        }

        const newAttachments = req.files ? req.files.map(file => file.path.replace(/\\/g, '/')) : [];
        const finalAttachments = [...existingAttachments, ...newAttachments];

        // Update fields
        if (req.body.title) log.title = req.body.title;
        if (req.body.description !== undefined) log.description = req.body.description;
        if (req.body.type) log.type = req.body.type;
        if (req.body.duration) log.duration = req.body.duration;
        if (req.body.company) log.company = req.body.company;
        if (req.body.steps) log.steps = parsedSteps;

        log.attachments = finalAttachments;

        await log.save();
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
