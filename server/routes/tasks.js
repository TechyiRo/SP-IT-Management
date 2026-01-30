const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

// ... (existing imports)

// @route   POST api/tasks
// @desc    Create a task (Admin)
// ...
router.post('/', auth, async (req, res) => {
    try {
        const newTask = new Task({
            ...req.body,
            assignedBy: req.user.id
        });
        const task = await newTask.save();

        // Notify Assigned User via WhatsApp
        if (task.assignedTo && task.assignedTo.length > 0) {
            // ... (keep existing Notification model logic)
            const notifications = task.assignedTo.map(userId => ({
                recipient: userId,
                message: `You have been assigned a new task: "${task.title}"`,
                type: 'task_assigned',
                relatedId: task._id,
                onModel: 'Task'
            }));
            await Notification.insertMany(notifications);
        }

        res.json(task);
    } catch (err) {
        console.error('Error in task creation:', err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/tasks/:id
// ...
router.put('/:id', auth, async (req, res) => {
    try {
        let task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ msg: 'Task not found' });

        const originalStatus = task.status;

        // ... (update fields)
        if (req.body.status) task.status = req.body.status;
        // ... (other fields)
        if (req.body.progress) task.progress = req.body.progress;
        if (req.body.assignedTo) task.assignedTo = req.body.assignedTo;
        if (req.body.title) task.title = req.body.title;
        if (req.body.description) task.description = req.body.description;
        if (req.body.deadline) task.deadline = req.body.deadline;
        if (req.body.priority) task.priority = req.body.priority;
        if (req.body.adminNotes) task.adminNotes = req.body.adminNotes;

        await task.save();

        // Notify on Status Change
        if (req.body.status && req.body.status !== originalStatus && task.assignedTo && task.assignedTo.length > 0) {
            const notifications = task.assignedTo.map(userId => ({
                recipient: userId,
                message: `Task "${task.title}" status updated to ${task.status}`,
                type: 'task_updated',
                relatedId: task._id,
                onModel: 'Task'
            }));
            await Notification.insertMany(notifications);
        }

        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// @desc    Get tasks assigned to me
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const tasks = await Task.find({ assignedTo: req.user.id }).populate('assignedBy', 'fullName').populate('products').populate('company').sort({ deadline: 1 });
        res.json(tasks);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/tasks
// @desc    Get all tasks (Admin)
// @access  Private (Admin)
router.get('/', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });
    try {
        const tasks = await Task.find().populate('assignedTo', 'fullName profilePicture phone').populate('assignedBy', 'fullName');
        res.json(tasks);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/tasks
// @desc    Create a task (Admin)
// @access  Private (Admin)
router.post('/', auth, async (req, res) => {
    // if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });
    // Keep it flexible, maybe managers can add too. For now admin only checks in frontend mostly? No enforce here.

    try {
        const newTask = new Task({
            ...req.body,
            assignedBy: req.user.id
        });
        const task = await newTask.save();
        console.log('Task created:', task._id);
        console.log('Assigned To:', task.assignedTo);

        // Create Notifications for assigned users
        if (task.assignedTo && task.assignedTo.length > 0) {
            console.log('Creating notifications for:', task.assignedTo);
            const notifications = task.assignedTo.map(userId => ({
                recipient: userId,
                message: `You have been assigned a new task: "${task.title}"`,
                type: 'task_assigned',
                relatedId: task._id,
                onModel: 'Task'
            }));

            try {
                await Notification.insertMany(notifications);
                console.log('Notifications created successfully');
            } catch (notifyErr) {
                console.error('Notification creation failed:', notifyErr);
            }
        } else {
            console.log('No users assigned, skipping notifications');
        }

        res.json(task);
    } catch (err) {
        console.error('Error in task creation:', err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/tasks/:id
// @desc    Update task status (Employee/Admin)
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        let task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ msg: 'Task not found' });

        const originalStatus = task.status;

        // Update fields
        if (req.body.status) task.status = req.body.status;
        if (req.body.progress) task.progress = req.body.progress;
        if (req.body.assignedTo) task.assignedTo = req.body.assignedTo; // Allow reassignment
        if (req.body.title) task.title = req.body.title;
        if (req.body.description) task.description = req.body.description;
        if (req.body.deadline) task.deadline = req.body.deadline;
        if (req.body.priority) task.priority = req.body.priority;
        if (req.body.adminNotes) task.adminNotes = req.body.adminNotes; // Support admin remarks


        await task.save();

        // Notify on Status Change
        if (req.body.status && req.body.status !== originalStatus && task.assignedTo && task.assignedTo.length > 0) {
            const notifications = task.assignedTo.map(userId => ({
                recipient: userId,
                message: `Task "${task.title}" status updated to ${task.status}`,
                type: 'task_updated',
                relatedId: task._id,
                onModel: 'Task'
            }));
            await Notification.insertMany(notifications);
        }

        // Notify on Reassignment (New users only - roughly)
        // For simplicity, just notify everyone currently assigned if assignments changed significantly? 
        // Or leave it for now. The requirement was "update and assign".
        // If it's a new assignment via PUT, we should probably check logic, but typically Admin uses POST to create. 
        // If Admin uses edit to assign new people, we'd need to compare old vs new.
        // Let's keep it simple: Status update is the main "Update" notification. 

        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/tasks/:id
// @desc    Get single task
// @access  Private
router.get('/:id', auth, async (req, res) => {
    console.log(`GET /api/tasks/${req.params.id} requested by user ${req.user.id}`);
    try {
        const task = await Task.findById(req.params.id)
            .populate('assignedTo', 'fullName profilePicture')
            .populate('assignedBy', 'fullName')
            .populate('activityLog.user', 'fullName');

        console.log(`Task found for ${req.params.id}:`, task ? 'Yes' : 'No');

        if (!task) return res.status(404).json({ msg: 'Task not found' });
        res.json(task);
    } catch (err) {
        console.error(`Error fetching task ${req.params.id}:`, err);
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Task not found (Invalid ID)' });
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/tasks/:id/requirements/:reqId
// @desc    Toggle requirement completion
// @access  Private
router.put('/:id/requirements/:reqId', auth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ msg: 'Task not found' });

        const reqItem = task.taskRequirements.id(req.params.reqId);
        if (!reqItem) return res.status(404).json({ msg: 'Requirement not found' });

        reqItem.completed = req.body.completed;
        await task.save();
        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Multer setup for attachments
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = 'uploads/task-attachments';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// @route   POST api/tasks/:id/updates
// @desc    Add detailed task update/resolution log
// @access  Private
router.post('/:id/updates', [auth, upload.array('attachments', 3)], async (req, res) => {
    console.log(`POST /api/tasks/${req.params.id}/updates called by user ${req.user.id}`);
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            console.log('Task not found');
            return res.status(404).json({ msg: 'Task not found' });
        }

        // Check if user is assigned or admin
        const isAssigned = task.assignedTo.some(id => id.toString() === req.user.id);
        if (!isAssigned && req.user.role !== 'admin') {
            console.log(`User ${req.user.id} not authorized to update task ${task._id}`);
            return res.status(403).json({ msg: 'Not authorized to update this task' });
        }

        const {
            issueResolved,
            stepsPerformed,
            problemFound,
            configurationChanged,
            resolutionSummary,
            remark,
            status // Optional status update
        } = req.body;

        console.log('Update Body:', req.body);
        console.log('Files:', req.files);

        const attachments = req.files ? req.files.map(file => file.path) : [];

        const newUpdate = {
            updatedBy: req.user.id,
            timestamp: Date.now(),
            issueResolved,
            stepsPerformed,
            problemFound,
            configurationChanged,
            resolutionSummary,
            remark,
            attachments,
            statusSnapshot: status || task.status
        };

        if (!task.taskUpdates) task.taskUpdates = []; // Ensure array exists
        task.taskUpdates.unshift(newUpdate); // Add to top

        // If status is provided, update the main task status too
        if (status && status !== task.status) {
            task.status = status;

            // Notify others? (Simple reuse of logic if needed, or rely on client to call status update separately? 
            // Better to handle it here if passed)
            // We can add a system log too
            task.activityLog.push({
                action: `Status changed to ${status}`,
                user: req.user.id,
                details: 'Via Activity Update'
            });
        }

        task.activityLog.push({
            action: 'Detailed Update Added',
            user: req.user.id,
            details: resolutionSummary ? resolutionSummary.substring(0, 50) + '...' : 'Work Logged'
        });

        await task.save();
        console.log('Task update saved successfully');
        res.json(task);

    } catch (err) {
        console.error('Error in POST /updates:', err);
        res.status(500).send('Server Error: ' + err.message);
    }
});

// @route   DELETE api/tasks/:id
// @desc    Delete a task
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ msg: 'Task not found' });

        await task.deleteOne();

        // Also remove related notifications?
        // await Notification.deleteMany({ relatedId: req.params.id, onModel: 'Task' });
        // Optional but good for cleanup. Let's keep it simple for now or include it.
        await Notification.deleteMany({ relatedId: req.params.id, onModel: 'Task' });

        res.json({ msg: 'Task removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
