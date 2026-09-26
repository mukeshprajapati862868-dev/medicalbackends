const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerValidation, loginValidation, refreshTokenValidation } = require('../validators/authValidator');
const {
  register,
  login,
  refreshToken,
  logout,
  getMe
} = require('../controllers/authController');

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.post('/refresh', refreshTokenValidation, refreshToken);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
