const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
} = require('../controllers/supplierController');

// All routes are protected
router.use(protect);

// Shop Owner and Admin routes
router.get('/', getSuppliers);
router.get('/:id', getSupplierById);
router.post('/', authorize('shop_owner'), createSupplier);
router.put('/:id', authorize('shop_owner'), updateSupplier);
router.delete('/:id', authorize('shop_owner'), deleteSupplier);

module.exports = router;
