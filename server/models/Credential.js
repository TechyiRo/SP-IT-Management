const mongoose = require('mongoose');

const CredentialSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    password: { type: String, required: true },
    details: { type: String, default: '' },
    color: { type: String, default: 'blue' }, // e.g., 'blue', 'red', 'green', 'purple', 'orange'
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Credential', CredentialSchema);
