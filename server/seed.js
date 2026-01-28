const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected for Seeding'))
    .catch(err => {
        console.log(err);
        process.exit(1);
    });

const seedAdmin = async () => {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            console.log('Admin already exists');
            process.exit();
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        const adminUser = new User({
            username: 'admin',
            password: hashedPassword,
            fullName: 'System Admin',
            email: 'admin@spit.com',
            designation: 'Administrator',
            department: 'IT',
            joinDate: new Date(),
            employeeId: 'ADM001',
            role: 'admin',
            status: 'active',
            permissions: {
                canAddProducts: true,
                canAddCompanies: true,
                canViewAllTasks: true,
                canAddWorkDetails: true,
                canViewReports: true
            }
        });

        await adminUser.save();
        console.log('Admin user created');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedAdmin();
