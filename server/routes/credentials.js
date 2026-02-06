const express = require('express');
const router = express.Router();
const Credential = require('../models/Credential');
const User = require('../models/User');
const verifyToken = require('../middleware/auth'); // Assuming auth middleware exists

// Get credentials for a specific company
router.get('/:companyId', verifyToken, async (req, res) => {
    try {
        let canViewDetails = true;

        // Check permission if not admin
        if (req.user.role !== 'admin') {
            const user = await User.findById(req.user.id);
            if (!user || !user.permissions.canManagePasswords) {
                return res.status(403).json({ message: "Access Denied: Permission required" });
            }
            canViewDetails = user.permissions.canViewPasswordDetails || false;
        }

        const credentials = await Credential.find({ company: req.params.companyId })
            .populate('addedBy', 'name'); // Populate addedBy with user's name

        // Mask data if not allowed
        if (!canViewDetails) {
            const maskedCredentials = credentials.map(cred => ({
                ...cred.toObject(),
                password: '', // Masked
                details: '', // Masked
                isRestricted: true // Flag for frontend
            }));
            return res.json(maskedCredentials);
        }

        res.json(credentials);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add new credential(s)
router.post('/', verifyToken, async (req, res) => {
    const { companyId, credentials } = req.body; // credentials should be an array of { name, username, password }

    if (!companyId || !credentials || !Array.isArray(credentials) || credentials.length === 0) {
        return res.status(400).json({ message: "Invalid data provided" });
    }

    // Check permission if not admin
    if (req.user.role !== 'admin') {
        const user = await User.findById(req.user.id);
        if (!user || !user.permissions.canManagePasswords) {
            return res.status(403).json({ message: "Access Denied: Permission required" });
        }
    }

    try {
        const newCredentials = credentials.map(cred => ({
            company: companyId,
            name: cred.name,
            username: cred.username,
            password: cred.password,
            details: cred.details || '',
            color: cred.color || 'blue',
            addedBy: req.user.id // From verifyToken middleware
        }));

        const savedCredentials = await Credential.insertMany(newCredentials);
        // Populate the addedBy field for the response
        const populatedCredentials = await Credential.populate(savedCredentials, { path: 'addedBy', select: 'name' });

        res.status(201).json(populatedCredentials);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a credential
router.put('/:id', verifyToken, async (req, res) => {
    try {
        // Check permission if not admin
        if (req.user.role !== 'admin') {
            const user = await User.findById(req.user.id);
            if (!user || !user.permissions.canManagePasswords) {
                return res.status(403).json({ message: "Access Denied: Permission required" });
            }
        }

        const { name, username, password, details, color } = req.body;

        const updatedCredential = await Credential.findByIdAndUpdate(
            req.params.id,
            {
                name,
                username,
                password,
                details: details || '',
                color: color || 'blue'
            },
            { new: true }
        ).populate('addedBy', 'name');

        if (!updatedCredential) return res.status(404).json({ message: 'Credential not found' });

        res.json(updatedCredential);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete a credential
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        // Check permission if not admin
        if (req.user.role !== 'admin') {
            const user = await User.findById(req.user.id);
            if (!user || !user.permissions.canManagePasswords) {
                return res.status(403).json({ message: "Access Denied: Permission required" });
            }
        }
        const credential = await Credential.findById(req.params.id);
        if (!credential) return res.status(404).json({ message: 'Credential not found' });

        await credential.deleteOne();
        res.json({ message: 'Credential deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
