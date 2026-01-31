const mongoose = require('mongoose');
require('dotenv').config();
const Tracking = require('./models/Tracking');
const Inventory = require('./models/Inventory');

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    // Check Latest Tracking
    const track = await Tracking.findOne().sort({ createdAt: -1 });
    console.log('Latest Tracking:', JSON.stringify(track, null, 2));

    // Check Inventory for Cat 6
    const inv = await Inventory.find({ name: { $regex: /Cat 6/i } });
    console.log('Inventory Cat 6:', JSON.stringify(inv, null, 2));

    // Check Logs
    const fs = require('fs');
    if (fs.existsSync('debug_tracking.txt')) {
        console.log('LOG FILE CONTENT:');
        console.log(fs.readFileSync('debug_tracking.txt', 'utf8'));
    }

    await mongoose.disconnect();
}
run();
