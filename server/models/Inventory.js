const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    variant: { type: String, default: '' },
    quantity: { type: Number, required: true, default: 0 },
    vendors: [{ type: String }], // Array of vendor names
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Inventory', InventorySchema);
