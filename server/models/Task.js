const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String }, // Rich text HTML
    priority: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
    },
    category: { type: String, default: 'Development' },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of User IDs
    // Extended Fields
    taskRequirements: [{
        text: String,
        completed: { type: Boolean, default: false }
    }],
    referenceLinks: [{
        url: String,
        description: String
    }],
    adminNotes: { type: String }, // Private notes for admin
    activityLog: [{
        action: String, // e.g., "Created", "Updated Status", "Commented"
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        details: String,
        location: String // Geo-link or coordinates
    }],
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deadline: { type: Date },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'On Hold', 'Resolved', 'Completed', 'Under Review', 'Cancelled'],
        default: 'Pending'
    },
    // Detailed Task Workflow Logs
    taskUpdates: [{
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        issueResolved: String,
        stepsPerformed: String,
        problemFound: String,
        configurationChanged: String,
        resolutionSummary: String,
        remark: String,
        attachments: [String],
        // Snapshot of status at this update
        statusSnapshot: String,
        location: String
    }],
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    attachments: [{ type: String }],
    progress: { type: Number, default: 0 }, // 0-100
    workLogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkLog' }],
    location: { type: String } // Latest known location (URL or coords)
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
