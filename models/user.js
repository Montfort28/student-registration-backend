// models/User.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  registrationNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  dateOfBirth: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isValidAge(value) {
        // Skip validation for admin users
        if (this.role === 'admin') return true;
        
        const today = new Date();
        const birthDate = new Date(value);
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 10 || age > 30) {
          throw new Error('Age must be between 10 and 30 years');
        }
      }
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'student'),
    defaultValue: 'student'
  }
}, {
  timestamps: true, // This will add createdAt and updatedAt fields
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance method to check password validity
User.prototype.isPasswordValid = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Function to generate registration number
User.generateRegistrationNumber = function(role = 'student') {
  const prefix = role === 'admin' ? 'ADM-' : 'REG-';
  const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${randomString}-2025`;
};

module.exports = User;