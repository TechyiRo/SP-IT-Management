const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   PUT api/users/live-location
// @desc    Update user live location
// @access  Private
router.put('/live-location', auth, async (req, res) => {
    try {
        console.log(`[Location] Update request from user ${req.user.id}`);
        const { latitude, longitude, address } = req.body;
        console.log(`[Location] Data: Lat=${latitude}, Lon=${longitude}, Addr=${address}`);

        const updatedUser = await User.findByIdAndUpdate(req.user.id, {
            $set: {
                lastLocation: {
                    latitude,
                    longitude,
                    address,
                    timestamp: new Date()
                }
            }
        }, { new: true });

        console.log(`[Location] User updated. New timestamp: ${updatedUser?.lastLocation?.timestamp}`);
        res.json({ msg: 'Location updated' });
    } catch (err) {
        console.error('[Location] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// @route   POST api/users
// @desc    Register a user (Admin only)
// @access  Private (Admin)
router.post('/', auth, async (req, res) => {
    // Check if admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied: Admins only' });
    }

    const { username, password, fullName, email, designation, department, phone, joinDate, employeeId, role, permissions } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({
            username,
            password,
            fullName,
            email,
            designation,
            department,
            phone,
            joinDate,
            employeeId,
            role,
            permissions
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/', auth, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ date: -1 });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

const multer = require('multer');
const path = require('path');

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: './uploads/profiles/',
    filename: function (req, file, cb) {
        cb(null, 'profile-' + req.user.id + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

// Check File Type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

// @route   PUT api/users/profile
// @desc    Update own profile
// @access  Private
router.put('/profile', [auth, upload.single('profilePicture')], async (req, res) => {
    // Note: req.body fields are available AFTER multer processes the form-data
    const { fullName, phone, address, designation, salary } = req.body;

    // Build profile object
    const profileFields = {};
    if (fullName) profileFields.fullName = fullName;
    if (phone) profileFields.phone = phone;
    if (address) profileFields.address = address;
    if (designation) profileFields.designation = designation;
    if (salary) profileFields.salary = salary;

    // If a file was uploaded, set the profilePicture path
    if (req.file) {
        // Construct URL assuming server runs on port 5000 (or whatever configured)
        // Ideally, store relative path and prepend base URL in frontend, OR store full URL here.
        // For simplicity, let's store the relative path users can access via http://localhost:5000/uploads/...
        // But to make it easier for frontend, let's try to construct a relative URL they can use.
        profileFields.profilePicture = `/uploads/profiles/${req.file.filename}`;
    } else if (req.body.profilePicture) {
        // If they sent a string URL (not a file), update it too (optional flexibility)
        profileFields.profilePicture = req.body.profilePicture;
    }

    try {
        let user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ msg: 'User not found' });

        user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: profileFields },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/users/:id
// @desc    Update a user
// @access  Private (Admin)
router.put('/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied' });
    }
    const { username, fullName, email, designation, department, phone, employeeId, role, permissions, password, status, baseSalary } = req.body;

    try {
        let user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.username = username || user.username;
        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.designation = designation || user.designation;
        user.department = department || user.department;
        user.phone = phone || user.phone;
        user.employeeId = employeeId || user.employeeId;
        user.role = role || user.role;
        user.permissions = permissions || user.permissions;
        if (status) user.status = status;
        if (baseSalary !== undefined) user.baseSalary = baseSalary;

        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/users/:id
// @desc    Delete a user
// @access  Private (Admin)
router.delete('/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied' });
    }
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'User removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
