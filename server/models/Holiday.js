const mongoose = require('mongoose');

const HolidaySchema = new mongoose.Schema({
    date: { type: Date, required: true, unique: true }, // Normalized to midnight
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['Public', 'Company', 'Optional'], default: 'Public' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Holiday', HolidaySchema);
