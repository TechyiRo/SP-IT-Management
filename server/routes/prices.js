const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const UserPrice = require('../models/UserPrice');

// @route   GET /api/prices/me
// @desc    Get logged in user's prices
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const prices = await UserPrice.find({ employee: req.user.id })
            .populate('product')
            .populate({
                path: 'product',
                populate: { path: 'vendor' }
            });
        res.json(prices);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/prices/all
// @desc    Get all users' prices (Admin View)
// @access  Private
router.get('/all', auth, async (req, res) => {
    try {
        const prices = await UserPrice.find()
            .populate('employee', 'fullName email designation')
            .populate('product')
            .populate({
                path: 'product',
                populate: { path: 'vendor' }
            });
        res.json(prices);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/prices
// @desc    Create or update a price for a product
// @access  Private
router.post('/', auth, async (req, res) => {
    const { product, buyingPrice, sellingPrice } = req.body;

    try {
        // Check if user already has a price logged for this product
        let userPrice = await UserPrice.findOne({ employee: req.user.id, product });

        if (userPrice) {
            // Update
            userPrice.buyingPrice = buyingPrice;
            userPrice.sellingPrice = sellingPrice;
            await userPrice.save(); // Pre-save hooks handle profit/margin math
            return res.json(userPrice);
        }

        // Create
        userPrice = new UserPrice({
            employee: req.user.id,
            product,
            buyingPrice,
            sellingPrice
        });

        await userPrice.save();
        res.json(userPrice);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
