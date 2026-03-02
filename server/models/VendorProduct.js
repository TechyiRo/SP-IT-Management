const mongoose = require('mongoose');

const vendorProductSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    unitType: {
        type: String,
        default: 'pcs'
    },
    vendorPrice: {
        type: Number,
        required: true,
        default: 0
    },
    stock: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('VendorProduct', vendorProductSchema);
