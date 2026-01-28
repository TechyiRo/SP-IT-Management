const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        enum: ['task_assigned', 'task_updated', 'general'],
        default: 'general'
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'onModel'
    },
    onModel: {
        type: String,
        required: true,
        enum: ['Task']
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
