const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        trim: true
    },
    contact: {
        type: String,
        trim: true
    },
    tagColor: {
        type: String,
        default: '#4FC3F7' // Default Electric Blue
    }
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);
