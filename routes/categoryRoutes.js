const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

// Public routes (read-only)
router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Protected routes (create, update, delete)
router.post('/', protect, authorize('admin', 'shop_owner'), createCategory);
router.put('/:id', protect, authorize('admin', 'shop_owner'), updateCategory);
router.delete('/:id', protect, authorize('admin', 'shop_owner'), deleteCategory);

module.exports = router;
