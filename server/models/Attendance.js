const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true }, // Normalized to midnight

    // Check-In Request
    checkIn: {
        time: { type: Date },
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            // default: 'Pending' - Removed to prevent auto-request
        },
        remarks: { type: String } // Employee remark
    },

    // Check-Out Request
    checkOut: {
        time: { type: Date },
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            // default: 'Pending' - Removed to prevent auto-request
        },
        remarks: { type: String }
    },

    // Half-Day Request
    halfDay: {
        isRequested: { type: Boolean, default: false },
        type: { type: String, enum: ['First Half', 'Second Half'] },
        reason: { type: String },
        attachment: { type: String },
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending'
        }
    },

    // Full Day Leave Request
    leave: {
        isRequested: { type: Boolean, default: false },
        reason: { type: String },
        attachment: { type: String },
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending'
        }
    },

    // Overall Status for the day
    status: {
        type: String, // 'Present', 'Absent', 'Half Day', 'On Leave', 'Pending...'
        enum: [
            'Present', 'Absent', 'Half Day', 'On Leave',
            'Pending Check-In', 'Pending Check-Out', 'Pending Half-Day', 'Pending Leave',
            'Checked-Out', 'Rejected', 'Holiday'
        ],
        default: 'Absent'
    },

    duration: { type: Number, default: 0 }, // In minutes
    location: { type: String }, // Captured at Check-In

    adminRemarks: { type: String }, // Admin feedback
    actionLog: [{
        action: String, // e.g., "Approved Check-In"
        admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

// Compound index to ensure one record per employee per day? 
// Or handle in logic. Uniqueness might be tricky if they check in multiple times? 
// Usually one attendance record per day per employee.
AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
