const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { sequelize, testConnection } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const User = require('./models/user');
const bcrypt = require('bcryptjs');
const loadSwagger = require('./swagger'); // ✅ Correct usage
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
loadSwagger(app);

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working' });
});

// Routes
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Student Registration System API' });
});

// 404 route
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Admin Seeder
const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: hashedPassword,
        dateOfBirth: new Date('2000-01-01'),
        registrationNumber: User.generateRegistrationNumber('admin'),
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('✅ Admin user seeded successfully');
    }
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  }
};

const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await testConnection();
    await sequelize.sync();
    await seedAdmin();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`✅ Swagger docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
};

startServer();
