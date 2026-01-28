const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    designation: { type: String, required: true }, // Developer, Manager, etc.
    department: { type: String, required: true },
    phone: { type: String },
    joinDate: { type: Date, required: true },
    employeeId: { type: String, unique: true },
    profilePicture: { type: String, default: '' },
    role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    permissions: {
        canAddProducts: { type: Boolean, default: false },
        canAddCompanies: { type: Boolean, default: false },
        canViewAllTasks: { type: Boolean, default: false },
        canAddWorkDetails: { type: Boolean, default: true },
        canViewReports: { type: Boolean, default: false }
    },
    lastLogin: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
