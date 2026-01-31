const mongoose = require('mongoose');
require('dotenv').config();
const Inventory = require('./models/Inventory');

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    const inputName = "Cat 6 Cable Box 1m"; // Simulating trimmed input
    const safeName = escapeRegExp(inputName);
    const regex = new RegExp('^\\s*' + safeName + '\\s*$', 'i');

    console.log(`Input: "${inputName}"`);
    console.log(`Regex: ${regex.toString()}`);

    const item = await Inventory.findOne({ name: { $regex: regex } });

    if (item) {
        console.log("MATCH FOUND!");
        console.log(`ID: ${item._id}`);
        console.log(`Name in DB: "${item.name}"`);
        console.log(`Quantity: ${item.quantity}`);
    } else {
        console.log("NO MATCH FOUND.");
        // List all similar items
        const all = await Inventory.find({ name: { $regex: /Cat/i } });
        console.log("Similar items in DB:");
        all.forEach(i => console.log(`- "${i.name}"`));
    }

    await mongoose.disconnect();
}

run().catch(console.error);
