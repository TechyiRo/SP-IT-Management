const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, '../debug_tracking.txt');
const log = (msg) => fs.appendFileSync(logFile, new Date().toISOString() + ': ' + msg + '\n');
const auth = require('../middleware/auth');
const Tracking = require('../models/Tracking');

// @route   GET api/tracking
// @desc    Get all tracking records
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const records = await Tracking.find()
            .populate('company', 'name')
            .populate('addedBy', 'fullName')
            .sort({ createdAt: -1 });
        res.json(records);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

const Inventory = require('../models/Inventory');

// Helper to escape regex special characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// @route   POST api/tracking
// @desc    Create new tracking record
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { company, products, status, transportation, transportationCharges } = req.body;

        log('Processing Tracking with Products: ' + JSON.stringify(products));

        // Deduce quantity from Inventory
        if (products && products.length > 0) {
            for (const product of products) {
                const safeName = escapeRegExp(product.name.trim());
                // Match name case-insensitively, allowing for surrounding whitespace
                const inventoryItem = await Inventory.findOne({
                    name: { $regex: new RegExp('^\\s*' + safeName + '\\s*$', 'i') }
                });

                log(`Searching for: "${product.name}" -> Regex: "^\\s*${safeName}\\s*$" -> Found: ${inventoryItem ? inventoryItem.name : 'NULL'}`);

                if (inventoryItem) {
                    const qtyToDeduce = parseInt(product.quantity) || 1;
                    inventoryItem.quantity -= qtyToDeduce;
                    await inventoryItem.save();
                    log(`Deducted ${qtyToDeduce} from "${inventoryItem.name}". New Qty: ${inventoryItem.quantity}`);
                } else {
                    log(`No inventory item found for "${product.name}"`);
                }
            }
        }

        const newTracking = new Tracking({
            company,
            products,
            status,
            transportation,
            transportationCharges,
            addedBy: req.user.id
        });

        const savedTracking = await newTracking.save();
        // Return populated document
        const populatedTracking = await Tracking.findById(savedTracking._id).populate('company', 'name');
        res.json(populatedTracking);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/tracking/:id
// @desc    Update tracking record
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        let tracking = await Tracking.findById(req.params.id);
        if (!tracking) return res.status(404).json({ msg: 'Record not found' });

        const { company, products, status, transportation, transportationCharges } = req.body;

        if (company) tracking.company = company;
        if (products) tracking.products = products;
        if (status) tracking.status = status;
        if (transportation) tracking.transportation = transportation;
        if (transportationCharges !== undefined) tracking.transportationCharges = transportationCharges;

        await tracking.save();
        const populatedTracking = await Tracking.findById(req.params.id).populate('company', 'name');
        res.json(populatedTracking);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/tracking/:id
// @desc    Delete tracking record
// @access  Private (Admin Only)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admins only.' });
        }
        const tracking = await Tracking.findById(req.params.id);
        if (!tracking) return res.status(404).json({ msg: 'Record not found' });

        await Tracking.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Record removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
