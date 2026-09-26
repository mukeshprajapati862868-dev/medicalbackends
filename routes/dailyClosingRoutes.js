const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getDailyClosing, closeDay } = require('../controllers/dailyClosingController');

router.use(protect, authorize('shop_owner', 'admin'));
router.get('/', getDailyClosing);
router.post('/', authorize('shop_owner'), closeDay);

module.exports = router;
