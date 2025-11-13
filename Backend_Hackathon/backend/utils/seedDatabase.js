// Seed Database - Creates test users on startup
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    // Check if test users already exist
    const adminExists = await User.findOne({ username: 'admin' });
    const userExists = await User.findOne({ username: 'testuser' });

    if (adminExists && userExists) {
      console.log('✓ Test users already exist in database');
      return;
    }

    // Create admin user
    if (!adminExists) {
      const adminUser = new User({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123', // Will be hashed by pre-save hook
        role: 'admin',
        isActive: true,
      });
      await adminUser.save();
      console.log('✓ Admin user created: admin / admin123');
    }

    // Create regular user
    if (!userExists) {
      const regularUser = new User({
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'test123', // Will be hashed by pre-save hook
        role: 'user',
        isActive: true,
      });
      await regularUser.save();
      console.log('✓ Test user created: testuser / test123');
    }

    console.log('✓ Database seeding completed\n');
  } catch (error) {
    console.error('✗ Error seeding database:', error.message);
  }
};

module.exports = seedDatabase;
