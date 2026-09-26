const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder
} = require('../controllers/orderController');

// All routes are protected
router.use(protect);

// Customer routes
router.post('/', authorize('customer'), createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', authorize('customer', 'shop_owner', 'admin'), cancelOrder);

// Shop Owner and Admin routes
router.put('/:id/status', authorize('shop_owner'), updateOrderStatus);

module.exports = router;
