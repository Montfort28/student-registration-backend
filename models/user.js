// models/User.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');

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
  },
  qrCode: {
    type: DataTypes.TEXT,
    allowNull: true
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
    afterCreate: async (user) => {
      try {
        const qrCode = await user.generateQRCode();
        if (qrCode) {
          await user.update({ qrCode });
        }
      } catch (error) {
        console.error('Error updating user with QR code:', error);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
      
      // Generate new QR code if essential user info changed
      if (user.changed('firstName') || user.changed('lastName') || 
          user.changed('email') || user.changed('registrationNumber') || 
          user.changed('role')) {
        try {
          const qrCode = await user.generateQRCode();
          if (qrCode) {
            user.qrCode = qrCode;
          }
        } catch (error) {
          console.error('Error updating QR code:', error);
        }
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

// Function to generate QR code for a user
User.prototype.generateQRCode = async function() {
  try {
    // Create user info object with essential details
    const userInfo = {
      id: this.id,
      name: `${this.firstName} ${this.lastName}`,
      email: this.email,
      registrationNumber: this.registrationNumber,
      role: this.role,
      dateOfBirth: this.dateOfBirth,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };

    // Generate QR code as base64 string
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(userInfo));
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return null;
  }
};

module.exports = User;