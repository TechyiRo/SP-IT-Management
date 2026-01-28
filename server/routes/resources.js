const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Product = require('../models/Product');
const Company = require('../models/Company');

// PRODUCTS

// @route   POST api/resources/products
// @desc    Add a product
// @access  Private
router.post('/products', auth, async (req, res) => {
    try {
        const newProduct = new Product({
            ...req.body,
            addedBy: req.user.id
        });
        const product = await newProduct.save();
        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/resources/products
// @desc    Get all products
// @access  Private
router.get('/products', auth, async (req, res) => {
    try {
        // Can filter by addedBy if needed for employee view
        const products = await Product.find().populate('addedBy', 'fullName').populate('assignedTo', 'fullName');
        res.json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// COMPANIES

// @route   POST api/resources/companies
// @desc    Add a company
// @access  Private
router.post('/companies', auth, async (req, res) => {
    try {
        const newCompany = new Company({
            ...req.body,
            addedBy: req.user.id
        });
        const company = await newCompany.save();
        res.json(company);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/resources/companies
// @desc    Get all companies
// @access  Private
router.get('/companies', auth, async (req, res) => {
    try {
        const companies = await Company.find().populate('addedBy', 'fullName');
        res.json(companies);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
