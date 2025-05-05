// controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Register a new student
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, dateOfBirth } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }
    
    // Generate registration number
    const registrationNumber = User.generateRegistrationNumber();
    
    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      dateOfBirth,
      registrationNumber
    });
    
    // Generate token
    const token = generateToken(user.id);
    
    // Remove password from response
    user.password = undefined;
    
    res.status(201).json({
      success: true,
      token,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    // Find user by email
    const user = await User.findOne({ where: { email } });
    
    // Check if user exists and password is correct
    if (!user || !(await user.isPasswordValid(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Generate token
    const token = generateToken(user.id);
    
    // Remove password from response
    user.password = undefined;
    
    res.status(200).json({
      success: true,
      token,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    // Ensure user has QR code
    if (!user.qrCode) {
      const qrCode = await user.generateQRCode();
      if (qrCode) {
        await user.update({ qrCode });
        user.qrCode = qrCode;
      }
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Regenerate QR code for current user
exports.regenerateQRCode = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const qrCode = await user.generateQRCode();
    
    if (!qrCode) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate QR code'
      });
    }
    
    await user.update({ qrCode });
    
    res.status(200).json({
      success: true,
      data: {
        qrCode
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};