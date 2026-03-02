const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Vendor = require('../models/Vendor');
const VendorProduct = require('../models/VendorProduct');

// @route   GET /api/vendors
// @desc    Get all vendors
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const vendors = await Vendor.find().sort({ name: 1 });
        res.json(vendors);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/vendors
// @desc    Create a new vendor
// @access  Private
router.post('/', auth, async (req, res) => {
    const { name, category, contact, tagColor } = req.body;
    try {
        const vendor = new Vendor({ name, category, contact, tagColor });
        await vendor.save();
        res.json(vendor);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/vendors/:id
// @desc    Delete a vendor and its products
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        await VendorProduct.deleteMany({ vendor: req.params.id });
        await Vendor.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Vendor removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// PRODUCTS ROUTES
// ==========================================

// @route   GET /api/vendors/:id/products
// @desc    Get all products for a specific vendor
// @access  Private
router.get('/:id/products', auth, async (req, res) => {
    try {
        const products = await VendorProduct.find({ vendor: req.params.id }).sort({ name: 1 });
        res.json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/vendors/products
// @desc    Create a new product under a vendor
// @access  Private
router.post('/products', auth, async (req, res) => {
    const { vendor, name, description, unitType, vendorPrice, stock } = req.body;
    try {
        const product = new VendorProduct({
            vendor, name, description, unitType, vendorPrice, stock
        });
        await product.save();
        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
