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

// @route   PUT api/resources/products/:id
// @desc    Update a product
// @access  Private
router.put('/products/:id', auth, async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ msg: 'Product not found' });

        product = await Product.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/resources/products/:id
// @desc    Delete a product
// @access  Private
router.delete('/products/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied. Admins only.' });
        let product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ msg: 'Product not found' });

        await Product.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Product removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/resources/companies/:id
// @desc    Update a company
// @access  Private
router.put('/companies/:id', auth, async (req, res) => {
    try {
        let company = await Company.findById(req.params.id);
        if (!company) return res.status(404).json({ msg: 'Company not found' });

        company = await Company.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        res.json(company);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/resources/companies/:id
// @desc    Delete a company
// @access  Private
router.delete('/companies/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied. Admins only.' });
        let company = await Company.findById(req.params.id);
        if (!company) return res.status(404).json({ msg: 'Company not found' });

        await Company.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Company removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
