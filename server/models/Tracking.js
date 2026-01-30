const mongoose = require('mongoose');

const TrackingSchema = new mongoose.Schema({
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    products: [{
        name: { type: String, required: true },
        serialNumber: { type: String, default: '' }
    }],
    status: {
        type: String,
        enum: ['Delivered', 'On Road', 'Hold'],
        default: 'On Road'
    },
    transportation: { type: String }, // e.g. 'Blue Dart', 'Hand Delivery'
    transportationCharges: { type: Number, default: 0 },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Tracking', TrackingSchema);
