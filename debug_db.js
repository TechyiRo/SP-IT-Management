const mongoose = require('mongoose');
const Task = require('./server/models/Task');
require('dotenv').config({ path: './server/.env' });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sp-it-mng');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const run = async () => {
    await connectDB();
    const id = '697772f27da4f8f466c607da';

    console.log(`Searching for Task ID: ${id}`);

    try {
        // Try finding by ID
        const task = await Task.findById(id);
        if (task) {
            console.log('Found Task:', JSON.stringify(task, null, 2));
        } else {
            console.log('Task NOT found via findById');
        }

        // Try listing all tasks to see IDs
        const allTasks = await Task.find({}, '_id title');
        console.log('All Tasks IDs:', allTasks.map(t => ({ id: t._id.toString(), title: t.title })));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        mongoose.disconnect();
    }
};

run();
