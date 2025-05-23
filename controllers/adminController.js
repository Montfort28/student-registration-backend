// controllers/adminController.js
const User = require('../models/user');

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { count, rows } = await User.findAndCountAll({
      attributes: { exclude: ['password'] },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });
    
    // Ensure all users have QR codes
    for (const user of rows) {
      if (!user.qrCode) {
        const qrCode = await user.generateQRCode();
        if (qrCode) {
          await user.update({ qrCode });
          user.qrCode = qrCode;
        }
      }
    }

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update user (admin only)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Extract and validate role explicitly
    const { firstName, lastName, email, dateOfBirth, role } = req.body;
    
    // Explicitly check and handle role
    const validRoles = ['admin', 'student'];
    const updatedRole = validRoles.includes(role) ? role : user.role;
    
    await user.update({
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      email: email || user.email,
      dateOfBirth: dateOfBirth || user.dateOfBirth,
      role: updatedRole // Use validated role
    });
    
    // Get updated user (without password)
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
    
    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Delete user
    await user.destroy();
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get single user by ID (admin only)
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
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

// Regenerate QR code for specific user (admin only)
exports.regenerateUserQRCode = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
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