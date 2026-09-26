const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
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
} = require('../controllers/adminController');

// All routes are admin only
router.use(protect, authorize('admin'));

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/role', changeUserRole);
router.put('/users/:id/status', toggleUserStatus);
router.put('/shop-owners/:id/block', blockShopOwner);
router.put('/shop-owners/:id/unblock', unblockShopOwner);

// Audit logs
router.get('/audit-logs', getAuditLogs);

// System statistics
router.get('/stats', getSystemStats);

module.exports = router;
