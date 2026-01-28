const mongoose = require('mongoose');

const WorkLogSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    title: { type: String, required: true },
    description: { type: String }, // Rich Text
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }, // Optional
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }, // Optional
    type: { type: String, required: true }, // Development, BugFix, Meeting
    duration: { type: Number, required: true }, // Minutes
    // Extended Tracking
    issuesFaced: { type: String },
    solutionsImplemented: { type: String },
    progressPercentage: { type: Number, min: 0, max: 100 },
    links: [String], // Links to commits or resources
    status: {
        type: String,
        enum: ['Pending', 'Working', 'Complete', 'OnHold'],
        default: 'Pending'
    },
    keyPoints: [{ type: String }],
    challenges: { type: String },
    attachments: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('WorkLog', WorkLogSchema);
