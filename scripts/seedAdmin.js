require('dotenv').config();
const { connectDB } = require('../config/db');
const Admin = require('../models/Admin');

const seedAdmin = async () => {
    try {
        await connectDB();
        
        // Check if admin already exists
        const adminExists = await Admin.findOne({ where: { email: 'admin@clarysays.com' } });
        if (adminExists) {
            console.log('Admin user already exists.');
            process.exit(0);
        }

        // Create default admin
        await Admin.create({
            name: 'Clarysays Admin',
            email: 'admin@clarysays.com',
            password: 'adminpassword123', // This will be hashed automatically by the model's beforeSave hook
            role: 'admin',
            permissions: ['all']
        });

        console.log('--------------------------------------------------');
        console.log('Admin user seeded successfully!');
        console.log('Email: admin@clarysays.com');
        console.log('Password: adminpassword123');
        console.log('--------------------------------------------------');
        process.exit(0);
    } catch (error) {
        console.error('Failed to seed admin user:', error);
        process.exit(1);
    }
};

seedAdmin();
