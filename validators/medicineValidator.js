const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array().map(err => err.msg).join(', ')
    });
  }
  next();
};

const createMedicineValidation = [
  body('medicineName')
    .trim()
    .notEmpty()
    .withMessage('Medicine name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Medicine name must be between 2 and 200 characters'),
  
  body('genericName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Generic name must not exceed 200 characters'),
  
  body('brand')
    .optional()
    .isMongoId()
    .withMessage('Invalid brand ID'),
  
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  
  body('manufacturer')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Manufacturer name must not exceed 200 characters'),
  
  body('composition')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Composition must not exceed 500 characters'),
  
  body('strength')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Strength must not exceed 50 characters'),
  
  body('dosage')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Dosage must not exceed 200 characters'),
  
  body('packSize')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Pack size must not exceed 50 characters'),
  
  body('unit')
    .optional()
    .isIn(['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'other'])
    .withMessage('Invalid unit type'),
  
  body('mrp')
    .notEmpty()
    .withMessage('MRP is required')
    .isFloat({ min: 0 })
    .withMessage('Default price is required')
    .isFloat({ min: 0 })
    .withMessage('Default price must be a positive number'),
  
  body('gst')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('GST must be between 0 and 100'),
  
  body('hsnCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('HSN code must not exceed 20 characters'),
  
  body('minimumStockLevel')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stock level must be a non-negative integer'),
  
  body('prescriptionRequired')
    .optional()
    .isBoolean()
    .withMessage('Prescription required must be a boolean'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('image')
    .optional()
    .trim()
    .isURL()
    .withMessage('Image must be a valid URL'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'discontinued'])
    .withMessage('Invalid status'),
  
  validate
];

const updateMedicineValidation = [
  body('medicineName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Medicine name cannot be empty')
    .isLength({ min: 2, max: 200 })
    .withMessage('Medicine name must be between 2 and 200 characters'),
  
  body('mrp')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('MRP must be a positive number'),
  
  body('defaultPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Default price must be a positive number'),
  
  body('gst')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('GST must be between 0 and 100'),
  
  body('minimumStockLevel')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stock level must be a non-negative integer'),
  
  validate
];

module.exports = {
  createMedicineValidation,
  updateMedicineValidation
};
