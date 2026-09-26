const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch,
  getInventorySummary
} = require('../controllers/batchController');

// All routes are protected
router.use(protect);

// Public routes for customers (read-only)
router.get('/', getBatches);
router.get('/summary', getInventorySummary);
router.get('/:id', getBatchById);

// Shop Owner and Admin routes (create, update, delete)
router.post('/', authorize('shop_owner'), createBatch);
router.put('/:id', authorize('shop_owner'), updateBatch);
router.delete('/:id', authorize('shop_owner'), deleteBatch);

module.exports = router;
