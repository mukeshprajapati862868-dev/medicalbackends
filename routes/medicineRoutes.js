// const express = require('express');
// const router = express.Router();
// const { protect, authorize } = require('../middleware/auth');
// const { createMedicineValidation, updateMedicineValidation } = require('../validators/medicineValidator');
// const {
//   getMedicines,
//   getMedicineById,
//   createMedicine,
//   updateMedicine,
//   deleteMedicine
// } = require('../controllers/medicineController');

// // All routes are protected
// router.use(protect);

// // Public routes for customers (read-only)
// router.get('/', getMedicines);
// router.get('/:id', getMedicineById);

// // Shop Owner and Admin routes (create, update, delete)
// router.post('/', authorize('shop_owner'), createMedicineValidation, createMedicine);
// router.put('/:id', authorize('shop_owner'), updateMedicineValidation, updateMedicine);
// router.delete('/:id', authorize('shop_owner'), deleteMedicine);

// module.exports = router;

const express = require('express');

const router = express.Router();

const {
  protect,
  authorize,
} = require('../middleware/auth');

const {
  createMedicineValidation,
  updateMedicineValidation,
} = require('../validators/medicineValidator');

const {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
} = require('../controllers/medicineController');


/*
 * All medicine routes require authentication.
 */
router.use(protect);


/*
 * GET
 *
 * Customer:
 *   all active medicines
 *
 * Shop owner:
 *   own active medicines
 *
 * Admin:
 *   active medicines
 */
router.get(
  '/',
  getMedicines
);


/*
 * GET SINGLE MEDICINE
 */
router.get(
  '/:id',
  getMedicineById
);


/*
 * CREATE
 *
 * Only shop owner.
 */
router.post(
  '/',
  authorize('shop_owner'),
  createMedicineValidation,
  createMedicine
);


/*
 * UPDATE
 *
 * Only shop owner.
 */
router.put(
  '/:id',
  authorize('shop_owner'),
  updateMedicineValidation,
  updateMedicine
);


/*
 * DELETE
 *
 * Only shop owner.
 */
router.delete(
  '/:id',
  authorize('shop_owner'),
  deleteMedicine
);


module.exports = router;