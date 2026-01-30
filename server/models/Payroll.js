const mongoose = require('mongoose');

const PayrollSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true }, // e.g. "01"
    year: { type: String, required: true }, // e.g. "2026"

    // Snapshot of data at time of generation
    baseSalary: { type: Number, required: true },
    hourlyRate: { type: Number, required: true },

    totalDays: { type: Number, default: 30 },
    presentDays: { type: Number, default: 0 },
    totalHours: { type: Number, default: 0 },

    // Financials
    calculatedWithHours: { type: Number, default: 0 }, // Part derived from hours
    bonus: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netSalary: { type: Number, required: true }, // Final Payable

    status: {
        type: String,
        enum: ['Generated', 'Paid'],
        default: 'Generated'
    },

    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    generatedAt: { type: Date, default: Date.now },

    paymentDate: { type: Date }, // When status becomes 'Paid'
    paymentMethod: { type: String } // Bank Transfer, Cash, etc.

}, { timestamps: true });

// Ensure one record per employee per month
PayrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', PayrollSchema);
