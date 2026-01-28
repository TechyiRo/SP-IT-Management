const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    serialNumber: { type: String, unique: true, required: true },
    type: { type: String, required: true }, // Laptop, Monitor, etc.
    status: {
        type: String,
        enum: ['Active', 'InStock', 'Maintenance', 'Deployed', 'Retired', 'Defective'],
        default: 'InStock'
    },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional
    location: { type: String },
    purchaseDate: { type: Date },
    warrantyPeriod: { type: Number }, // Months
    specifications: { type: String }, // Rich Text
    notes: { type: String },
    image: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
