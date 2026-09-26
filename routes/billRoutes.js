const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getBills,
  getBillById,
  createBill,
  cancelBill
} = require('../controllers/billController');

// All routes are protected
router.use(protect);

// Shop Owner and Admin routes
router.get('/', getBills);
router.get('/:id', getBillById);
router.post('/', authorize('shop_owner'), createBill);
router.put('/:id/cancel', authorize('shop_owner'), cancelBill);

module.exports = router;
