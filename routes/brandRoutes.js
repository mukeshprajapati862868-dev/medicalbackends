const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand
} = require('../controllers/brandController');

// Public routes (read-only)
router.get('/', getBrands);
router.get('/:id', getBrandById);

// Protected routes (create, update, delete)
router.post('/', protect, authorize('admin', 'shop_owner'), createBrand);
router.put('/:id', protect, authorize('admin', 'shop_owner'), updateBrand);
router.delete('/:id', protect, authorize('admin', 'shop_owner'), deleteBrand);

module.exports = router;
