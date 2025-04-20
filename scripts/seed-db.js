const bcrypt = require('bcrypt');
const { User } = require('../models');
require('dotenv').config();

async function seedAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      where: { role: 'admin' } 
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: hashedPassword,
        registrationNumber: 'ADM-' + Math.floor(1000 + Math.random() * 9000) + '-2025',
        dateOfBirth: new Date('2000-01-01'),
        role: 'admin'
      });
      console.log('Admin user created successfully!');
    } else {
      console.log('Admin user already exists.');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
}

seedAdmin();