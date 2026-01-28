const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    address: { type: String },
    city: { type: String },
    country: { type: String },
    contactPerson: { type: String },
    email: { type: String },
    phone: { type: String },
    type: { type: String }, // Client, Vendor
    industry: { type: String },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['Active', 'Potential', 'Inactive'],
        default: 'Active'
    },
    notes: { type: String },
    logo: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Company', CompanySchema);
