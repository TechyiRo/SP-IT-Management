const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Inventory = require('../models/Inventory');

// @route   GET api/inventory
// @desc    Get all inventory items
// @access  Private (Admin & Employee)
router.get('/', auth, async (req, res) => {
    try {
        const items = await Inventory.find().populate('addedBy', 'fullName');
        res.json(items);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/inventory
// @desc    Add new inventory item
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { name, quantity, vendors, variant } = req.body;

        let item = await Inventory.findOne({ name, variant: variant || '' });
        if (item) {
            // If item exists, update quantity and add new vendors
            item.quantity = parseInt(item.quantity) + parseInt(quantity);
            const uniqueVendors = [...new Set([...item.vendors, ...vendors])];
            item.vendors = uniqueVendors;
            await item.save();
            return res.json(item);
        }

        const newItem = new Inventory({
            name,
            quantity,
            vendors,
            variant: variant || '',
            addedBy: req.user.id
        });

        const savedItem = await newItem.save();
        res.json(savedItem);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/inventory/:id
// @desc    Update inventory item
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        let item = await Inventory.findById(req.params.id);
        if (!item) return res.status(404).json({ msg: 'Item not found' });

        const { name, quantity, vendors, variant } = req.body;

        if (name) item.name = name;
        if (variant !== undefined) item.variant = variant || '';
        if (quantity !== undefined) item.quantity = parseInt(quantity);
        if (vendors) item.vendors = Array.isArray(vendors) ? vendors : [];

        await item.save();
        await item.save();
        res.json(item);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error: ' + err.message });
    }
});

// @route   DELETE api/inventory/:id
// @desc    Delete inventory item
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admins only.' });
        }
        const item = await Inventory.findById(req.params.id);
        if (!item) return res.status(404).json({ msg: 'Item not found' });

        await Inventory.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Item removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error: ' + err.message });
    }
});

module.exports = router;
