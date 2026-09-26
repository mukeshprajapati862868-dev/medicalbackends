const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getPayments, createPayment } = require('../controllers/paymentController');

router.use(protect, authorize('shop_owner', 'admin'));
router.get('/', getPayments);
router.post('/', authorize('shop_owner'), createPayment);

module.exports = router;
