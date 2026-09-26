// const { Medicine, Category, Brand, Batch } = require('../models');
// const { createAuditLog } = require('../services/auditService');

// // Get all medicines with pagination and filters
// const getMedicines = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 20;
//     const skip = (page - 1) * limit;
    
//     // Build query
//     const query = {};
    
//     // Role-based filtering
//     if (req.user.role === 'shop_owner') {
//       query.shopOwner = req.user._id;
//     }
    
//     // Search filters
//     if (req.query.search) {
//       query.$or = [
//         { medicineName: { $regex: req.query.search, $options: 'i' } },
//         { genericName: { $regex: req.query.search, $options: 'i' } },
//         { composition: { $regex: req.query.search, $options: 'i' } }
//       ];
//     }
    
//     // Category filter
//     if (req.query.category) {
//       query.category = req.query.category;
//     }
    
//     // Brand filter
//     if (req.query.brand) {
//       query.brand = req.query.brand;
//     }
    
//     // Status filter
//     if (req.query.status) {
//       query.status = req.query.status;
//     }
    
//     // Get medicines
//     const medicines = await Medicine.find(query)
//       .populate('category', 'name')
//       .populate('brand', 'name')
//       .populate('shopOwner', 'name email')
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);
    
//     // Get total count
//     const total = await Medicine.countDocuments(query);
    
//     res.json({
//       success: true,
//       data: {
//         medicines,
//         pagination: {
//           page,
//           limit,
//           total,
//           pages: Math.ceil(total / limit)
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Get medicines error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Error fetching medicines'
//     });
//   }
// };

// // Get single medicine by ID
// const getMedicineById = async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     const query = { _id: id };
    
//     // Role-based filtering
//     if (req.user.role === 'shop_owner') {
//       query.shopOwner = req.user._id;
//     }
    
//     const medicine = await Medicine.findOne(query)
//       .populate('category', 'name description')
//       .populate('brand', 'name description')
//       .populate('shopOwner', 'name email');
    
//     if (!medicine) {
//       return res.status(404).json({
//         success: false,
//         error: 'Medicine not found'
//       });
//     }
    
//     // Get batches for this medicine
//     const batches = await Batch.find({ 
//       medicine: id,
//       shopOwner: req.user.role === 'shop_owner' ? req.user._id : medicine.shopOwner
//     }).sort({ expiryDate: 1 });
    
//     res.json({
//       success: true,
//       data: {
//         medicine,
//         batches
//       }
//     });
//   } catch (error) {
//     console.error('Get medicine error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Error fetching medicine'
//     });
//   }
// };

// // Create new medicine
// const createMedicine = async (req, res) => {
//   try {
//     const medicineData = {
//       ...req.body,
//       shopOwner: req.user._id
//     };
    
//     const medicine = await Medicine.create(medicineData);
    
//     // Create audit log
//     await createAuditLog({
//       user: req.user._id,
//       role: req.user.role,
//       action: 'medicine_created',
//       resource: 'Medicine',
//       resourceId: medicine._id,
//       metadata: { 
//         medicineName: medicine.medicineName,
//         shopOwner: req.user._id 
//       },
//       ipAddress: req.ip,
//       userAgent: req.get('user-agent')
//     });
    
//     res.status(201).json({
//       success: true,
//       data: { medicine }
//     });
//   } catch (error) {
//     console.error('Create medicine error:', error);
    
//     if (error.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         error: 'Medicine with this name already exists'
//       });
//     }
    
//     res.status(500).json({
//       success: false,
//       error: 'Error creating medicine'
//     });
//   }
// };

// // Update medicine
// const updateMedicine = async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     const query = { _id: id };
    
//     // Role-based filtering
//     if (req.user.role === 'shop_owner') {
//       query.shopOwner = req.user._id;
//     }
    
//     const medicine = await Medicine.findOne(query);
    
//     if (!medicine) {
//       return res.status(404).json({
//         success: false,
//         error: 'Medicine not found'
//       });
//     }
    
//     // Keep ownership controlled by the authenticated user.
//     const editableFields = [
//       'medicineName', 'genericName', 'brand', 'category', 'manufacturer',
//       'composition', 'strength', 'dosage', 'packSize', 'unit', 'mrp',
//       'defaultPrice', 'gst', 'hsnCode', 'minimumStockLevel',
//       'prescriptionRequired', 'description', 'image', 'status'
//     ];
//     Object.assign(
//       medicine,
//       Object.fromEntries(Object.entries(req.body).filter(([field]) => editableFields.includes(field)))
//     );
//     await medicine.save();
    
//     // Create audit log
//     await createAuditLog({
//       user: req.user._id,
//       role: req.user.role,
//       action: 'medicine_updated',
//       resource: 'Medicine',
//       resourceId: medicine._id,
//       metadata: { 
//         medicineName: medicine.medicineName,
//         changes: req.body 
//       },
//       ipAddress: req.ip,
//       userAgent: req.get('user-agent')
//     });
    
//     res.json({
//       success: true,
//       data: { medicine }
//     });
//   } catch (error) {
//     console.error('Update medicine error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Error updating medicine'
//     });
//   }
// };

// // Delete medicine
// const deleteMedicine = async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     const query = { _id: id };
    
//     // Role-based filtering
//     if (req.user.role === 'shop_owner') {
//       query.shopOwner = req.user._id;
//     }
    
//     const medicine = await Medicine.findOne(query);
    
//     if (!medicine) {
//       return res.status(404).json({
//         success: false,
//         error: 'Medicine not found'
//       });
//     }
    
//     // Check if medicine has stock in batches
//     const batches = await Batch.find({ medicine: id });
//     const totalStock = batches.reduce((sum, batch) => sum + batch.quantity, 0);
    
//     if (totalStock > 0) {
//       return res.status(400).json({
//         success: false,
//         error: 'Cannot delete medicine with existing stock. Please remove stock first.'
//       });
//     }
    
//     await Medicine.findByIdAndDelete(id);
    
//     // Create audit log
//     await createAuditLog({
//       user: req.user._id,
//       role: req.user.role,
//       action: 'medicine_deleted',
//       resource: 'Medicine',
//       resourceId: id,
//       metadata: { 
//         medicineName: medicine.medicineName 
//       },
//       ipAddress: req.ip,
//       userAgent: req.get('user-agent')
//     });
    
//     res.json({
//       success: true,
//       data: { message: 'Medicine deleted successfully' }
//     });
//   } catch (error) {
//     console.error('Delete medicine error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Error deleting medicine'
//     });
//   }
// };

// module.exports = {
//   getMedicines,
//   getMedicineById,
//   createMedicine,
//   updateMedicine,
//   deleteMedicine
// };

const mongoose = require('mongoose');
const { Medicine, Batch } = require('../models');

/*
 * GET ALL MEDICINES
 *
 * Customer:
 *   - all active medicines
 *
 * Shop owner:
 *   - only his medicines
 *
 * Admin:
 *   - all active medicines unless shopOwner filter is supplied
 */
const getMedicines = async (req, res, next) => {
  try {
    const {
      search = '',
      status,
      shopOwner,
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    /*
     * Status
     *
     * If status is supplied, use it.
     * Otherwise customer/shop owner gets active medicines.
     */
    if (status) {
      query.status = status;
    } else {
      query.status = 'active';
    }

    /*
     * SHOP OWNER FILTER
     *
     * Customer:
     *   No filter => sees medicines from all shops.
     *
     * Shop owner:
     *   No shopOwner query => sees only own medicines.
     *
     * Admin:
     *   Can optionally filter by shopOwner.
     */
    if (shopOwner) {
      if (mongoose.Types.ObjectId.isValid(shopOwner)) {
        query.shopOwner = shopOwner;
      }
    } else if (req.user?.role === 'shop_owner') {
      query.shopOwner = req.user._id;
    }

    /*
     * Search
     */
    if (search && search.trim()) {
      const searchText = search.trim();

      query.$or = [
        {
          medicineName: {
            $regex: searchText,
            $options: 'i',
          },
        },
      ];
    }

    /*
     * Brand filter
     */
    /*
     * Pagination
     */
    const pageNumber = Math.max(
      Number(page) || 1,
      1
    );

    const limitNumber = Math.min(
      Math.max(Number(limit) || 50, 1),
      100
    );

    const skip =
      (pageNumber - 1) * limitNumber;

    /*
     * Get medicines + total
     */
    const [medicines, total] =
      await Promise.all([
        Medicine.find(query)
          .populate('shopOwner', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNumber)
          .lean(),

        Medicine.countDocuments(query),
      ]);

    /*
     * Ensure stock is always returned as number.
     */
    const medicinesWithStock = medicines.map(
      (medicine) => ({
        ...medicine,
        stock: Number(medicine.stock || 0),
        mrp: Number(medicine.mrp || 0),
        defaultPrice: Number(
          medicine.defaultPrice || 0
        ),
        gst: Number(medicine.gst || 0),
        minimumStockLevel: Number(
          medicine.minimumStockLevel || 0
        ),
      })
    );

    return res.status(200).json({
      success: true,

      data: {
        medicines: medicinesWithStock,

        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          pages: Math.ceil(
            total / limitNumber
          ),
        },

        /*
         * Also expose total directly.
         * This doesn't break existing frontend.
         */
        total,
      },
    });
  } catch (error) {
    console.error(
      'Get medicines error:',
      error
    );

    next(error);
  }
};


/*
 * GET SINGLE MEDICINE
 */
const getMedicineById = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid medicine ID',
      });
    }

    const medicine =
      await Medicine.findById(id)
        .populate(
          'shopOwner',
          'name email'
        )
        .lean();

    if (!medicine) {
      return res.status(404).json({
        success: false,
        error: 'Medicine not found',
      });
    }

    const result = {
      ...medicine,
      stock: Number(
        medicine.stock || 0
      ),
      mrp: Number(medicine.mrp || 0),
      defaultPrice: Number(
        medicine.defaultPrice || 0
      ),
    };

    return res.status(200).json({
      success: true,

      data: {
        medicine: result,
      },
    });
  } catch (error) {
    console.error(
      'Get medicine by ID error:',
      error
    );

    next(error);
  }
};


/*
 * CREATE MEDICINE
 */
const createMedicine = async (
  req,
  res,
  next
) => {
  try {
    const {
      medicineName,
      unit,
      purchasePrice,
      mrp,
      defaultPrice,
      gst,
      stock,
      enableBatchTracking = false,
      batches = [],
      hsnCode = '',
      minimumStockLevel = 10,
      status = 'active',
    } = req.body;

    /*
     * Medicine name
     */
    if (
      !medicineName ||
      !medicineName.trim()
    ) {
      return res.status(400).json({
        success: false,
        error: 'Medicine name is required',
      });
    }

    const validUnits = [
      'tablet', 'capsule', 'syrup', 'injection', 'cream',
      'ointment', 'drops', 'inhaler', 'other',
    ];

    if (!validUnits.includes(unit)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid unit type',
      });
    }

    /* MRP and default price */
    if (
      mrp === undefined ||
      mrp === null ||
      mrp === ''
    ) {
      return res.status(400).json({
        success: false,
        error: 'MRP is required',
      });
    }

    /*
     * Default price
     */
    if (
      defaultPrice === undefined ||
      defaultPrice === null ||
      defaultPrice === ''
    ) {
      return res.status(400).json({
        success: false,
        error: 'Default price is required',
      });
    }

    const mrpValue = Number(mrp);

    const defaultPriceValue =
      Number(defaultPrice);

    if (
      !Number.isFinite(mrpValue) ||
      mrpValue < 0
    ) {
      return res.status(400).json({
        success: false,
        error: 'MRP must be a valid number',
      });
    }

    if (
      !Number.isFinite(defaultPriceValue) ||
      defaultPriceValue < 0
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Default price must be a valid number',
      });
    }

    /*
     * Stock
     */
    const stockValue = Number(stock);

    if (
      !Number.isFinite(stockValue) ||
      stockValue < 0
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Stock must be a valid number greater than or equal to 0',
      });
    }

    /*
     * GST
     */
    const gstValue =
      gst === undefined ||
      gst === null ||
      gst === ''
        ? 0
        : Number(gst);

    if (
      !Number.isFinite(gstValue) ||
      gstValue < 0 ||
      gstValue > 100
    ) {
      return res.status(400).json({
        success: false,
        error:
          'GST must be between 0 and 100',
      });
    }

    /*
     * Minimum stock
     */
    const minimumStockValue = Number(minimumStockLevel);

    if (
      !Number.isFinite(
        minimumStockValue
      ) ||
      minimumStockValue < 0
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Minimum stock level must be a valid number',
      });
    }

    const purchasePriceValue = Number(purchasePrice);
    if (!Number.isFinite(purchasePriceValue) || purchasePriceValue < 0) {
      return res.status(400).json({
        success: false,
        error: 'Purchase price must be a valid number',
      });
    }

    if (!Array.isArray(batches)) {
      return res.status(400).json({
        success: false,
        error: 'Batches must be an array',
      });
    }

    const normalizedBatches = batches.map((batch) => ({
      batchNumber: String(batch.batchNumber || '').trim(),
      expiryDate: batch.expiryDate,
      stock: Number(batch.stock),
      unit: batch.unit,
    }));

    if (enableBatchTracking) {
      if (!normalizedBatches.length || normalizedBatches.some((batch) => (
        !batch.batchNumber || !batch.expiryDate ||
        !Number.isFinite(batch.stock) || batch.stock < 0 ||
        !validUnits.includes(batch.unit)
      ))) {
        return res.status(400).json({
          success: false,
          error: 'Valid batch number, expiry date, stock, and unit are required',
        });
      }

      const batchStock = normalizedBatches.reduce((sum, batch) => sum + batch.stock, 0);
      if (batchStock !== stockValue) {
        return res.status(400).json({
          success: false,
          error: 'Medicine stock must equal total batch stock',
        });
      }
    }

    /* Create medicine using only the public medicine fields. */
    const medicine =
      await Medicine.create({
        medicineName:
          medicineName.trim(),

        unit,

        purchasePrice:
          purchasePriceValue,

        mrp:
          mrpValue,

        defaultPrice:
          defaultPriceValue,

        gst:
          gstValue,

        /*
         * IMPORTANT
         */
        stock:
          stockValue,

        enableBatchTracking: Boolean(enableBatchTracking),

        batches: normalizedBatches,

        hsnCode:
          hsnCode || '',

        minimumStockLevel:
          minimumStockValue,

        status,

        shopOwner:
          req.user._id,
      });

    if (enableBatchTracking) {
      await Batch.insertMany(normalizedBatches.map((batch) => ({
        medicine: medicine._id,
        batchNumber: batch.batchNumber,
        quantity: batch.stock,
        purchasePrice: purchasePriceValue,
        manufacturingDate: new Date(),
        expiryDate: batch.expiryDate,
        shopOwner: req.user._id,
      })));
    }

    /* Populate created medicine */
    const populatedMedicine =
      await Medicine.findById(
        medicine._id
      )
        .populate(
          'shopOwner',
          'name email'
        )
        .lean();

    return res.status(201).json({
      success: true,

      data: {
        medicine: {
          ...populatedMedicine,

          stock: Number(
            populatedMedicine.stock || 0
          ),
        },
      },

      message:
        'Medicine created successfully',
    });
  } catch (error) {
    console.error(
      'Create medicine error:',
      error
    );

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error:
          'Medicine with this name already exists',
      });
    }

    next(error);
  }
};


/*
 * UPDATE MEDICINE
 */
const updateMedicine = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid medicine ID',
      });
    }

    const medicine =
      await Medicine.findById(id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        error: 'Medicine not found',
      });
    }

    /*
     * Owner can only update own medicine.
     */
    if (
      req.user.role === 'shop_owner' &&
      String(
        medicine.shopOwner
      ) !==
        String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        error:
          'You are not allowed to update this medicine',
      });
    }

    const allowedFields = [
      'medicineName', 'unit', 'purchasePrice', 'mrp',
      'defaultPrice', 'gst', 'stock', 'enableBatchTracking', 'batches',
      'hsnCode', 'minimumStockLevel', 'status',
    ];

    allowedFields.forEach(
      (field) => {
        if (
          Object.prototype.hasOwnProperty.call(
            req.body,
            field
          )
        ) {
          medicine[field] =
            req.body[field];
        }
      }
    );

    /*
     * Validate stock
     */
    if (
      req.body.stock !== undefined
    ) {
      const stockValue =
        Number(req.body.stock);

      if (
        !Number.isFinite(
          stockValue
        ) ||
        stockValue < 0
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Stock must be a valid number greater than or equal to 0',
        });
      }

      medicine.stock =
        stockValue;
    }

    /*
     * Validate MRP
     */
    if (
      req.body.mrp !== undefined
    ) {
      const value =
        Number(req.body.mrp);

      if (
        !Number.isFinite(value) ||
        value < 0
      ) {
        return res.status(400).json({
          success: false,
          error:
            'MRP must be a valid number',
        });
      }

      medicine.mrp = value;
    }

    /*
     * Validate default price
     */
    if (
      req.body.defaultPrice !==
      undefined
    ) {
      const value =
        Number(
          req.body.defaultPrice
        );

      if (
        !Number.isFinite(value) ||
        value < 0
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Default price must be a valid number',
        });
      }

      medicine.defaultPrice =
        value;
    }

    await medicine.save();

    const updatedMedicine =
      await Medicine.findById(
        medicine._id
      )
        .populate(
          'shopOwner',
          'name email'
        )
        .lean();

    return res.status(200).json({
      success: true,

      data: {
        medicine: {
          ...updatedMedicine,

          stock: Number(
            updatedMedicine.stock || 0
          ),
        },
      },

      message:
        'Medicine updated successfully',
    });
  } catch (error) {
    console.error(
      'Update medicine error:',
      error
    );

    next(error);
  }
};


/*
 * DELETE MEDICINE
 */
const deleteMedicine = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid medicine ID',
      });
    }

    const medicine =
      await Medicine.findById(id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        error: 'Medicine not found',
      });
    }

    /*
     * Owner can delete only own medicine.
     */
    if (
      req.user.role === 'shop_owner' &&
      String(
        medicine.shopOwner
      ) !==
        String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        error:
          'You are not allowed to delete this medicine',
      });
    }

    await Medicine.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,

      data: {
        id,
      },

      message:
        'Medicine deleted successfully',
    });
  } catch (error) {
    console.error(
      'Delete medicine error:',
      error
    );

    next(error);
  }
};


module.exports = {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
};