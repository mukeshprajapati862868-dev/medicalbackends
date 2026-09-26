const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getSalesReport,
  getStockReport,
  getExpiryReport,
  getPurchaseReport,
  getProfitReport,
  getDashboardData
} = require('../controllers/reportsController');

// All routes are protected
router.use(protect);

// Shop Owner and Admin routes
router.get('/sales', authorize('shop_owner', 'admin'), getSalesReport);
router.get('/stock', authorize('shop_owner', 'admin'), getStockReport);
router.get('/expiry', authorize('shop_owner', 'admin'), getExpiryReport);
router.get('/purchase', authorize('shop_owner', 'admin'), getPurchaseReport);
router.get('/profit', authorize('shop_owner', 'admin'), getProfitReport);
router.get('/dashboard', authorize('shop_owner', 'admin'), getDashboardData);

module.exports = router;
