const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getReturns, createReturn } = require('../controllers/returnController');

router.use(protect, authorize('shop_owner', 'admin'));
router.get('/', getReturns);
router.post('/', authorize('shop_owner'), createReturn);

module.exports = router;
