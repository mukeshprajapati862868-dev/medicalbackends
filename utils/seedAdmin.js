// /const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
// const { User } = require('../models');
// require('dotenv').config();

// const seedAdmin = async () => {
//   try {
//     // Connect to database
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log('MongoDB Connected');
    
//     // Check if admin already exists
//     const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
//     const adminPassword = process.env.ADMIN_PASSWORD || 'Vani@2026';
//     const existingAdmin = await User.findOne({ email: adminEmail });
//     if (existingAdmin) {
//       console.log('Admin already exists');
//       process.exit(0);
//     }
    
//     // Create admin user
//     const admin = await User.create({
//       name: 'System Admin',
//       email: adminEmail,
//       password: adminPassword,
//       role: 'admin',
//       isActive: true
//     });
    
//     console.log('Admin created successfully:');
//     console.log(`Email: ${admin.email}`);
//     console.log('Admin created. Change the development password before production.');
    
//     process.exit(0);
//   } catch (error) {
//     console.error('Error seeding admin:', error);
//     process.exit(1);
//   }
// };

// seedAdmin();

const mongoose = require('mongoose');
const path = require('path');
const { User } = require('../models');

// Load .env from backend root folder
require('dotenv').config({
  path: path.join(__dirname, '../.env')
});

const seedAdmin = async () => {
  try {
    // Check MongoDB URI
    if (!process.env.MONGO_URI) {
      throw new Error(
        'MONGO_URI is not defined. Please check backend/.env file.'
      );
    }

    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB Connected');

    // Admin credentials
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Vani@2026';

    // Check if admin/user already exists
    const existingAdmin = await User.findOne({
      email: adminEmail
    }).select('+password');

    if (existingAdmin) {
      console.log('Existing user found:', existingAdmin.email);

      // Update existing user as admin
      existingAdmin.name = 'System Admin';
      existingAdmin.role = 'admin';
      existingAdmin.isActive = true;

      // Set admin password
      existingAdmin.password = adminPassword;

      // Clear old refresh token
      existingAdmin.refreshToken = undefined;

      await existingAdmin.save();

      console.log('========================================');
      console.log('ADMIN UPDATED SUCCESSFULLY');
      console.log('========================================');
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`Password: ${adminPassword}`);
      console.log(`Role: ${existingAdmin.role}`);
      console.log(`Active: ${existingAdmin.isActive}`);
      console.log('========================================');
      console.log('You can now login as admin.');
      console.log('========================================');
    } else {
      // Create new admin user
      const admin = await User.create({
        name: 'System Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isActive: true
      });

      console.log('========================================');
      console.log('ADMIN CREATED SUCCESSFULLY');
      console.log('========================================');
      console.log(`Email: ${admin.email}`);
      console.log(`Password: ${adminPassword}`);
      console.log(`Role: ${admin.role}`);
      console.log(`Active: ${admin.isActive}`);
      console.log('========================================');
      console.log('You can now login as admin.');
      console.log('========================================');
    }

    // Close MongoDB connection
    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error('========================================');
    console.error('ERROR SEEDING ADMIN');
    console.error('========================================');
    console.error(error);
    console.error('========================================');

    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error('MongoDB disconnect error:', disconnectError);
    }

    process.exit(1);
  }
};

seedAdmin();