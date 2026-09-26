// const { User } = require('../models');
// const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../config/jwt');
// const { createAuditLog } = require('../services/auditService');

// // Register new user (Shop Owner or Customer only - Admin cannot register publicly)
// const register = async (req, res) => {
//   try {
//     const { name, email, password, confirmPassword, role, mobile, shopDetails } = req.body;
    
//     // Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         error: 'User already exists with this email'
//       });
//     }
    
//     // Create user
//     const userData = {
//       name,
//       email,
//       password,
//       role: role || 'customer',
//       mobile
//     };
    
//     // Add shop details if shop owner
//     if (role === 'shop_owner' && shopDetails) {
//       userData.shopDetails = shopDetails;
//     }
    
//     const user = await User.create(userData);
    
//     // Generate tokens
//     const accessToken = generateAccessToken(user);
//     const refreshToken = generateRefreshToken(user);
    
//     // Save refresh token to user
//     user.refreshToken = refreshToken;
//     await user.save();
    
//     // Create audit log
//     await createAuditLog({
//       user: user._id,
//       role: user.role,
//       action: 'register',
//       resource: 'User',
//       resourceId: user._id,
//       metadata: { email: user.email, role: user.role },
//       ipAddress: req.ip,
//       userAgent: req.get('user-agent')
//     });
    
//     res.status(201).json({
//       success: true,
//       data: {
//         user: user.toJSON(),
//         accessToken,
//         refreshToken
//       }
//     });
//   } catch (error) {
//     console.error('Register error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Error creating user'
//     });
//   }
// };

// // Login user
// const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
    
//     // Find user and include password for comparison
//     const user = await User.findOne({ email }).select('+password');
    
//     if (!user) {
//       // Create audit log for failed login
//       await createAuditLog({
//         user: null,
//         role: 'unknown',
//         action: 'failed_login',
//         resource: 'Auth',
//         metadata: { email },
//         ipAddress: req.ip,
//         userAgent: req.get('user-agent'),
//         success: false,
//         errorMessage: 'User not found'
//       });
      
//       return res.status(401).json({
//         success: false,
//         error: 'Invalid credentials'
//       });
//     }
    
//     // Check if user is active
//     if (!user.isActive) {
//       await createAuditLog({
//         user: user._id,
//         role: user.role,
//         action: 'failed_login',
//         resource: 'Auth',
//         resourceId: user._id,
//         metadata: { email: user.email },
//         ipAddress: req.ip,
//         userAgent: req.get('user-agent'),
//         success: false,
//         errorMessage: 'Account disabled'
//       });
      
//       return res.status(401).json({
//         success: false,
//         error: 'Account is disabled'
//       });
//     }
    
//     // Check password
//     const isPasswordValid = await user.comparePassword(password);
    
//     if (!isPasswordValid) {
//       await createAuditLog({
//         user: user._id,
//         role: user.role,
//         action: 'failed_login',
//         resource: 'Auth',
//         resourceId: user._id,
//         metadata: { email: user.email },
//         ipAddress: req.ip,
//         userAgent: req.get('user-agent'),
//         success: false,
//         errorMessage: 'Invalid password'
//       });
      
//       return res.status(401).json({
//         success: false,
//         error: 'Invalid credentials'
//       });
//     }
    
//     // Generate tokens
//     const accessToken = generateAccessToken(user);
//     const refreshToken = generateRefreshToken(user);
    
//     // Save refresh token to user
//     user.refreshToken = refreshToken;
//     await user.save();
    
//     // Create audit log for successful login
//     await createAuditLog({
//       user: user._id,
//       role: user.role,
//       action: 'login',
//       resource: 'Auth',
//       resourceId: user._id,
//       metadata: { email: user.email },
//       ipAddress: req.ip,
//       userAgent: req.get('user-agent')
//     });
    
//     res.json({
//       success: true,
//       data: {
//         user: user.toJSON(),
//         accessToken,
//         refreshToken
//       }
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Error during login'
//     });
//   }
// };

// // Refresh access token
// const refreshToken = async (req, res) => {
//   try {
//     const { refreshToken } = req.body;
    
//     if (!refreshToken) {
//       return res.status(400).json({
//         success: false,
//         error: 'Refresh token is required'
//       });
//     }
    
//     // Verify refresh token
//     const decoded = verifyRefreshToken(refreshToken);
    
//     // Find user
//     const user = await User.findById(decoded.id).select('+refreshToken');
    
//     if (!user || user.refreshToken !== refreshToken) {
//       return res.status(401).json({
//         success: false,
//         error: 'Invalid refresh token'
//       });
//     }
    
//     // Check if user is active
//     if (!user.isActive) {
//       return res.status(401).json({
//         success: false,
//         error: 'Account is disabled'
//       });
//     }
    
//     // Generate new tokens
//     const newAccessToken = generateAccessToken(user);
//     const newRefreshToken = generateRefreshToken(user);
    
//     // Update refresh token
//     user.refreshToken = newRefreshToken;
//     await user.save();
    
//     res.json({
//       success: true,
//       data: {
//         accessToken: newAccessToken,
//         refreshToken: newRefreshToken
//       }
//     });
//   } catch (error) {
//     console.error('Refresh token error:', error);
//     res.status(401).json({
//       success: false,
//       error: 'Invalid refresh token'
//     });
//   }
// };

// // Logout user
// const logout = async (req, res) => {
//   try {
//     // Clear refresh token
//     req.user.refreshToken = undefined;
//     await req.user.save();
    
//     // Create audit log
//     await createAuditLog({
//       user: req.user._id,
//       role: req.user.role,
//       action: 'logout',
//       resource: 'Auth',
//       resourceId: req.user._id,
//       metadata: { email: req.user.email },
//       ipAddress: req.ip,
//       userAgent: req.get('user-agent')
//     });
    
//     res.json({
//       success: true,
//       data: { message: 'Logged out successfully' }
//     });
//   } catch (error) {
//     console.error('Logout error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Error during logout'
//     });
//   }
// };

// // Get current user
// const getMe = async (req, res) => {
//   try {
//     res.json({
//       success: true,
//       data: { user: req.user.toJSON() }
//     });
//   } catch (error) {
//     console.error('Get me error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Error fetching user data'
//     });
//   }
// };

// module.exports = {
//   register,
//   login,
//   refreshToken,
//   logout,
//   getMe
// };

const { User } = require('../models');

const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../config/jwt');

const {
  createAuditLog,
} = require('../services/auditService');

// Register new user
// Shop Owner or Customer only - Admin cannot register publicly
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      role,
      mobile,
      shopDetails,
    } = req.body;

    // Admin cannot be registered through public registration
    if (role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin registration is not allowed publicly',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email',
      });
    }

    // Create user
    const userData = {
      name,
      email,
      password,
      role: role || 'customer',
      mobile,
    };

    // Add shop details if shop owner
    if (role === 'shop_owner' && shopDetails) {
      userData.shopDetails = shopDetails;
    }

    const user = await User.create(userData);

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // Create audit log
    await createAuditLog({
      user: user._id,
      role: user.role,
      action: 'register',
      resource: 'User',
      resourceId: user._id,
      metadata: {
        email: user.email,
        role: user.role,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Register error:', error);

    res.status(500).json({
      success: false,
      error: 'Error creating user',
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');

    // User not found
    if (!user) {
      // Failed login audit
      // No MongoDB user exists, so user remains null.
      // AuditLog schema now allows null for failed login.
      await createAuditLog({
        user: null,
        role: 'unknown',
        action: 'failed_login',
        resource: 'Auth',
        metadata: {
          email,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        success: false,
        errorMessage: 'User not found',
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      await createAuditLog({
        user: user._id,
        role: user.role,
        action: 'failed_login',
        resource: 'Auth',
        resourceId: user._id,
        metadata: {
          email: user.email,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        success: false,
        errorMessage: 'Account disabled',
      });

      return res.status(401).json({
        success: false,
        error: 'Account is disabled',
      });
    }

    // Check password
    const isPasswordValid =
      await user.comparePassword(password);

    if (!isPasswordValid) {
      await createAuditLog({
        user: user._id,
        role: user.role,
        action: 'failed_login',
        resource: 'Auth',
        resourceId: user._id,
        metadata: {
          email: user.email,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        success: false,
        errorMessage: 'Invalid password',
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // --------------------------------------------------
    // ADMIN / SHOP OWNER / CUSTOMER
    // --------------------------------------------------
    // Existing database role is used directly.
    //
    // admin       -> admin login
    // shop_owner  -> shop owner login
    // customer    -> customer login
    //
    // No email/password is changed.
    // --------------------------------------------------

    const userRole = user.role;

    // Make sure role is valid
    if (
      !['admin', 'shop_owner', 'customer'].includes(
        userRole
      )
    ) {
      return res.status(403).json({
        success: false,
        error: 'Invalid user role',
      });
    }

    // Generate tokens
    const accessToken =
      generateAccessToken(user);

    const refreshToken =
      generateRefreshToken(user);

    // Save refresh token to user
    user.refreshToken = refreshToken;

    await user.save();

    // Create audit log for successful login
    await createAuditLog({
      user: user._id,
      role: userRole,
      action: 'login',
      resource: 'Auth',
      resourceId: user._id,
      metadata: {
        email: user.email,
        role: userRole,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    res.status(500).json({
      success: false,
      error: 'Error during login',
    });
  }
};

// Refresh access token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const decoded =
      verifyRefreshToken(refreshToken);

    // Find user
    const user =
      await User.findById(decoded.id)
        .select('+refreshToken');

    if (
      !user ||
      user.refreshToken !== refreshToken
    ) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is disabled',
      });
    }

    // Check role
    if (
      !['admin', 'shop_owner', 'customer'].includes(
        user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        error: 'Invalid user role',
      });
    }

    // Generate new tokens
    const newAccessToken =
      generateAccessToken(user);

    const newRefreshToken =
      generateRefreshToken(user);

    // Update refresh token
    user.refreshToken = newRefreshToken;

    await user.save();

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error(
      'Refresh token error:',
      error
    );

    res.status(401).json({
      success: false,
      error: 'Invalid refresh token',
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    // Clear refresh token
    req.user.refreshToken = undefined;

    await req.user.save();

    // Create audit log
    await createAuditLog({
      user: req.user._id,
      role: req.user.role,
      action: 'logout',
      resource: 'Auth',
      resourceId: req.user._id,
      metadata: {
        email: req.user.email,
        role: req.user.role,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (error) {
    console.error(
      'Logout error:',
      error
    );

    res.status(500).json({
      success: false,
      error: 'Error during logout',
    });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.toJSON(),
      },
    });
  } catch (error) {
    console.error(
      'Get me error:',
      error
    );

    res.status(500).json({
      success: false,
      error: 'Error fetching user data',
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
};