const { User, AuditLog } = require('../models');
const { createAuditLog } = require('../services/auditService');

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    
    // Role filter
    if (req.query.role) {
      query.role = req.query.role;
    }
    
    // Status filter
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }
    
    // Search filter
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Get users
    const users = await User.find(query)
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching users'
    });
  }
};

// Get user by ID (Admin only)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshToken');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching user'
    });
  }
};

// Update user (Admin only)
const updateUser = async (req, res) => {
  try {
    const allowedFields = ['name', 'email', 'mobile', 'shopDetails', 'isActive', 'status'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([field]) => allowedFields.includes(field))
    );

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -refreshToken');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Create audit log
    await createAuditLog({
      user: req.user._id,
      role: req.user.role,
      action: 'user_updated',
      resource: 'User',
      resourceId: user._id,
      metadata: { 
        userEmail: user.email,
        changes: updates
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating user'
    });
  }
};

// Delete user (Admin only)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Prevent deleting admin users
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete admin users'
      });
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    // Create audit log
    await createAuditLog({
      user: req.user._id,
      role: req.user.role,
      action: 'user_deleted',
      resource: 'User',
      resourceId: req.params.id,
      metadata: { 
        userEmail: user.email,
        userRole: user.role 
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json({
      success: true,
      data: { message: 'User deleted successfully' }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting user'
    });
  }
};

// Change user role (Admin only)
const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Validate role
    const validRoles = ['shop_owner', 'customer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role'
      });
    }
    
    // Prevent changing admin role
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Cannot change admin role'
      });
    }
    
    const oldRole = user.role;
    user.role = role;
    await user.save();
    
    // Create audit log
    await createAuditLog({
      user: req.user._id,
      role: req.user.role,
      action: 'role_changed',
      resource: 'User',
      resourceId: user._id,
      metadata: { 
        userEmail: user.email,
        oldRole,
        newRole: role 
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json({
      success: true,
      data: { user: user.toJSON() }
    });
  } catch (error) {
    console.error('Change user role error:', error);
    res.status(500).json({
      success: false,
      error: 'Error changing user role'
    });
  }
};

// Disable/Enable user account (Admin only)
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Prevent disabling admin users
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Cannot disable admin users'
      });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    // Create audit log
    await createAuditLog({
      user: req.user._id,
      role: req.user.role,
      action: user.isActive ? 'account_enabled' : 'account_disabled',
      resource: 'User',
      resourceId: user._id,
      metadata: { 
        userEmail: user.email,
        isActive: user.isActive 
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json({
      success: true,
      data: { user: user.toJSON() }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      error: 'Error toggling user status'
    });
  }
};

// Block a shop owner and invalidate their refresh token.
const blockShopOwner = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'shop_owner' },
      { status: 'blocked', isActive: false, $unset: { refreshToken: 1 } },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({ success: false, error: 'Shop owner not found' });
    }

    await createAuditLog({
      user: req.user._id,
      role: req.user.role,
      action: 'BLOCK_SHOP_OWNER',
      resource: 'User',
      resourceId: user._id,
      metadata: { targetUser: user._id, reason: req.body.reason || null },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ success: true, data: { user } });
  } catch (error) {
    console.error('Block shop owner error:', error);
    res.status(500).json({ success: false, error: 'Error blocking shop owner' });
  }
};

// Unblock a shop owner and restore normal account access.
const unblockShopOwner = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'shop_owner' },
      { status: 'active', isActive: true, $unset: { refreshToken: 1 } },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({ success: false, error: 'Shop owner not found' });
    }

    await createAuditLog({
      user: req.user._id,
      role: req.user.role,
      action: 'UNBLOCK_SHOP_OWNER',
      resource: 'User',
      resourceId: user._id,
      metadata: { targetUser: user._id },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ success: true, data: { user } });
  } catch (error) {
    console.error('Unblock shop owner error:', error);
    res.status(500).json({ success: false, error: 'Error unblocking shop owner' });
  }
};

// Get audit logs (Admin only)
const getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    
    // User filter
    if (req.query.user) {
      query.user = req.query.user;
    }
    
    // Action filter
    if (req.query.action) {
      query.action = req.query.action;
    }
    
    // Resource filter
    if (req.query.resource) {
      query.resource = req.query.resource;
    }
    
    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) {
        query.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.createdAt.$lte = new Date(req.query.endDate);
      }
    }
    
    // Get audit logs
    const auditLogs = await AuditLog.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count
    const total = await AuditLog.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        auditLogs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching audit logs'
    });
  }
};

// Get system statistics (Admin only)
const getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalShopOwners = await User.countDocuments({ role: 'shop_owner' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const activeUsers = await User.countDocuments({ isActive: true });
    
    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          admins: totalAdmins,
          shopOwners: totalShopOwners,
          customers: totalCustomers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        }
      }
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching system statistics'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  changeUserRole,
  toggleUserStatus,
  blockShopOwner,
  unblockShopOwner,
  getAuditLogs,
  getSystemStats
};
