const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs'); // Assumed available in server/node_modules
require('dotenv').config();

const run = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sp-it-mng');

        const tempEmail = 'debug_user_' + Date.now() + '@example.com';
        const tempPass = 'password123';

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(tempPass, salt);

        console.log('Creating temp user in DB...');
        const newUser = new User({
            username: 'debug_' + Date.now(),
            fullName: 'Debug User',
            email: tempEmail,
            password: passwordHash,
            role: 'employee',
            department: 'IT',
            designation: 'Tester',
            joinDate: new Date()
        });

        await newUser.save();
        console.log('User created:', newUser._id);

        await mongoose.disconnect();
        console.log('Disconnected from DB.');

        // Login via API
        console.log('Logging in via API...');
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: newUser.username,
                password: tempPass
            })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Got token:', token ? 'Yes' : 'No');

        // 1. Try /api/tasks/me
        console.log('Fetching /api/tasks/me...');
        const meRes = await fetch('http://localhost:5000/api/tasks/me', { headers: { 'x-auth-token': token } });
        console.log('/me Status:', meRes.status);
        if (meRes.ok) console.log('/me Success:', await meRes.text());
        else console.log('/me Error:', await meRes.text());

        // 2. Try /api/tasks (Admin only? Debug User is employee, expected 403 or 200 depending on logic)
        // routes/tasks.js says GET / is admin only.
        console.log('Fetching /api/tasks...');
        const listRes = await fetch('http://localhost:5000/api/tasks', { headers: { 'x-auth-token': token } });
        console.log('/ Status:', listRes.status); // Expected 403

        // 2b. Try /api/tasks/debug/123
        console.log('Fetching /api/tasks/debug/123...');
        const debugRes = await fetch('http://localhost:5000/api/tasks/debug/123', { headers: { 'x-auth-token': token } });
        console.log('/debug Status:', debugRes.status);
        if (debugRes.ok) console.log('/debug Success:', await debugRes.text());
        else console.log('/debug Error:', await debugRes.text());

        // 3. Try /api/tasks/:id
        const taskId = '697772f27da4f8f466c607da';
        console.log(`Fetching Task ${taskId}...`);

        const taskRes = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
            headers: { 'x-auth-token': token }
        });

        console.log('API Response Status:', taskRes.status);
        if (taskRes.ok) {
            const taskData = await taskRes.json();
            console.log('Task Title:', taskData.title);
        } else {
            console.log('API Error Status:', taskRes.status);
            const errData = await taskRes.text();
            console.log('API Error Body:', errData);
        }

    } catch (err) {
        console.error('Script Error:', err.message);
    }
};

run();
