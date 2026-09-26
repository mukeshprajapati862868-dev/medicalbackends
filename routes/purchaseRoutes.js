const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPurchases,
  getPurchaseById,
  createPurchase
} = require('../controllers/purchaseController');

// All routes are protected
router.use(protect);

// Shop Owner and Admin routes
router.get('/', getPurchases);
router.get('/:id', getPurchaseById);
router.post('/', authorize('shop_owner'), createPurchase);

module.exports = router;
