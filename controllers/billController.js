// const { Bill, Batch, Medicine, User } = require('../models');
// const { createAuditLog } = require('../services/auditService');
// const { validateMedicineReference } = require('../utils/objectIdValidation');
// const mongoose = require('mongoose');

// // Get all bills with pagination and filters
// const getBills = async (req, res) => {
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
    
//     // Customer filter
//     if (req.query.customer) {
//       query.customer = req.query.customer;
//     }
    
//     // Status filter
//     if (req.query.status) {
//       query.status = req.query.status;
//     }
    
//     // Date range filter
//     if (req.query.startDate || req.query.endDate) {
//       query.billDate = {};
//       if (req.query.startDate) {
//         query.billDate.$gte = new Date(req.query.startDate);
//       }
//       if (req.query.endDate) {
//         query.billDate.$lte = new Date(req.query.endDate);
//       }
//     }
    
//     // Bill number search
//     if (req.query.billNumber) {
//       query.billNumber = { $regex: req.query.billNumber, $options: 'i' };
//     }
    
//     // Get bills
//     const bills = await Bill.find(query)
//       .populate('customer', 'name email mobile')
//       .populate('items.medicine', 'medicineName genericName')
//       .populate('shopOwner', 'name email')
//       .sort({ billDate: -1 })
//       .skip(skip)
//       .limit(limit);
    
//     // Get total count
//     const total = await Bill.countDocuments(query);
    
//     res.json({
//       success: true,
//       data: {
//         bills,
//         pagination: {
//           page,
//           limit,
//           total,
//           pages: Math.ceil(total / limit)
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Get bills error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Error fetching bills'
//     });
//   }
// };

// // Get single bill by ID
// const getBillById = async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     const query = { _id: id };
    
//     // Role-based filtering
//     if (req.user.role === 'shop_owner') {
//       query.shopOwner = req.user._id;
//     }
    
//     const bill = await Bill.findOne(query)
//       .populate('customer', 'name email mobile')
//       .populate('items.medicine', 'medicineName genericName category brand')
//       .populate('shopOwner', 'name email shopDetails');
    
//     if (!bill) {
//       return res.status(404).json({
//         success: false,
//         error: 'Bill not found'
//       });
//     }
    
//     res.json({
//       success: true,
//       data: { bill }
//     });
//   } catch (error) {
//     console.error('Get bill error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Error fetching bill'
//     });
//   }
// };

// // Create new bill with stock deduction
// const createBill = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
  
//   try {
//     const { customer, customerName, customerMobile, items, discount, tax, paymentMethod, notes } = req.body;

//     if (!Array.isArray(items) || items.length === 0) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         error: 'At least one bill item is required',
//       });
//     }
    
//     // Validate customer if provided
//     if (customer) {
//       const customerDoc = await User.findById(customer).session(session);
//       if (!customerDoc) {
//         await session.abortTransaction();
//         return res.status(404).json({
//           success: false,
//           error: 'Customer not found'
//         });
//       }
//     }
    
//     // Validate items and calculate totals
//     let subtotal = 0;
//     const processedItems = [];
    
//     for (const item of items) {
//       const idCheck = validateMedicineReference(item && item.medicine);
//       if (!idCheck.isValid) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           error: idCheck.error
//         });
//       }

//       // Validate medicine
//       const medicine = await Medicine.findOne({
//         _id: item.medicine,
//         shopOwner: req.user._id
//       }).session(session);
      
//       if (!medicine) {
//         await session.abortTransaction();
//         return res.status(404).json({
//           success: false,
//           error: `Medicine not found: ${item.medicine}`
//         });
//       }
      
//       const batchQuery = {
//         medicine: item.medicine,
//         shopOwner: req.user._id,
//       };
//       if (medicine.enableBatchTracking) {
//         batchQuery.batchNumber = item.batchNumber;
//       }

//       // Validate batch for tracked medicines; untracked medicines use Medicine.stock.
//       const batch = medicine.enableBatchTracking
//         ? await Batch.findOne(batchQuery).session(session)
//         : null;
      
//       if (medicine.enableBatchTracking && !batch) {
//         await session.abortTransaction();
//         return res.status(404).json({
//           success: false,
//           error: `Batch not found: ${item.batchNumber}`
//         });
//       }
      
//       // Check if batch is expired
//       if (batch && batch.expiryDate < new Date()) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           error: `Batch ${item.batchNumber} is expired and cannot be sold`
//         });
//       }
      
//       // Check if sufficient quantity is available
//       const availableStock = batch ? batch.quantity : medicine.stock;
//       if (availableStock < item.quantity) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           error: 'Insufficient stock.'
//         });
//       }
      
//       // Validate quantity
//       if (item.quantity <= 0) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           error: 'Quantity must be greater than 0'
//         });
//       }
      
//       // Validate unit price
//       if (!Number.isFinite(Number(item.unitPrice)) || Number(item.unitPrice) <= 0) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           error: 'Unit price must be greater than 0'
//         });
//       }
      
//       // Calculate line total
//       const itemDiscount = Number(item.discount || 0);
//       const itemTax = Number(item.tax || medicine.gst || 0);
//       const lineSubtotal = (item.quantity * item.unitPrice) - itemDiscount;
//       const lineTotal = lineSubtotal + (lineSubtotal * (itemTax / 100));
      
//       processedItems.push({
//         medicine: item.medicine,
//         medicineNameSnapshot: medicine.medicineName,
//         batchNumber: item.batchNumber,
//         quantity: item.quantity,
//         unitPrice: item.unitPrice,
//         discount: itemDiscount,
//         tax: itemTax,
//         lineTotal
//       });
      
//       subtotal += (item.quantity * item.unitPrice);
//     }
    
//     // Calculate final totals
//     const totalDiscount = Number(discount || 0);
//     const totalTax = processedItems.reduce((sum, item) => {
//       const lineSubtotal = (item.quantity * item.unitPrice) - item.discount;
//       return sum + (lineSubtotal * (item.tax / 100));
//     }, 0);
//     if (totalDiscount < 0 || totalDiscount > subtotal) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid discount',
//       });
//     }
//     const grandTotal = subtotal - totalDiscount + totalTax;
    
//     // Generate bill number
//     const billNumber = `BILL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
//     // Create bill
//     const bill = await Bill.create([{
//       billNumber,
//       customer,
//       customerName,
//       customerMobile,
//       items: processedItems,
//       subtotal,
//       discount: totalDiscount,
//       tax: totalTax,
//       grandTotal,
//       paymentMethod,
//       notes,
//       shopOwner: req.user._id
//     }], { session });
    
//     // Deduct stock from both the embedded medicine record and the legacy Batch read model.
//     for (const item of items) {
//       const medicine = await Medicine.findOne({
//         _id: item.medicine,
//         shopOwner: req.user._id,
//       }).session(session);

//       medicine.stock -= item.quantity;
//       if (medicine.enableBatchTracking) {
//         const embeddedBatch = medicine.batches.find(
//           (batch) => batch.batchNumber === item.batchNumber
//         );
//         embeddedBatch.stock -= item.quantity;
//         const batch = await Batch.findOne({
//           medicine: item.medicine,
//           batchNumber: item.batchNumber,
//           shopOwner: req.user._id,
//         }).session(session);
//         batch.quantity -= item.quantity;
//         await batch.save({ session });
//       }
//       await medicine.save({ session });
//     }
    
//     await session.commitTransaction();
    
//     // Create audit log
//     await createAuditLog({
//       user: req.user._id,
//       role: req.user.role,
//       action: 'bill_created',
//       resource: 'Bill',
//       resourceId: bill[0]._id,
//       metadata: { 
//         billNumber,
//         customer: customerName || customer,
//         grandTotal,
//         itemCount: items.length
//       },
//       ipAddress: req.ip,
//       userAgent: req.get('user-agent')
//     });
    
//     res.status(201).json({
//       success: true,
//       data: { bill: bill[0] }
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     console.error('Create bill error:', error);
    
//     if (error.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         error: 'Bill with this number already exists'
//       });
//     }
    
//     res.status(500).json({
//       success: false,
//       error: 'Error creating bill'
//     });
//   } finally {
//     session.endSession();
//   }
// };

// // Cancel bill
// const cancelBill = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
  
//   try {
//     const { id } = req.params;
    
//     const query = { _id: id };
    
//     // Role-based filtering
//     if (req.user.role === 'shop_owner') {
//       query.shopOwner = req.user._id;
//     }
    
//     const bill = await Bill.findOne(query).session(session);
    
//     if (!bill) {
//       await session.abortTransaction();
//       return res.status(404).json({
//         success: false,
//         error: 'Bill not found'
//       });
//     }
    
//     if (bill.status === 'cancelled') {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         error: 'Bill is already cancelled'
//       });
//     }
    
//     // Restore stock to batches
//     for (const item of bill.items) {
//       const batch = await Batch.findOne({
//         medicine: item.medicine,
//         batchNumber: item.batchNumber,
//         shopOwner: req.user._id
//       }).session(session);
      
//       if (batch) {
//         batch.quantity += item.quantity;
//         await batch.save({ session });
//       }
//     }
    
//     // Update bill status
//     bill.status = 'cancelled';
//     await bill.save({ session });
    
//     await session.commitTransaction();
    
//     // Create audit log
//     await createAuditLog({
//       user: req.user._id,
//       role: req.user.role,
//       action: 'bill_cancelled',
//       resource: 'Bill',
//       resourceId: bill._id,
//       metadata: { 
//         billNumber: bill.billNumber,
//         grandTotal: bill.grandTotal
//       },
//       ipAddress: req.ip,
//       userAgent: req.get('user-agent')
//     });
    
//     res.json({
//       success: true,
//       data: { bill }
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     console.error('Cancel bill error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Error cancelling bill'
//     });
//   } finally {
//     session.endSession();
//   }
// };

// module.exports = {
//   getBills,
//   getBillById,
//   createBill,
//   cancelBill
// };



const { Bill, Batch, Medicine, User } = require('../models');
const { createAuditLog } = require('../services/auditService');
const { validateMedicineReference } = require('../utils/objectIdValidation');
const mongoose = require('mongoose');

// Get all bills with pagination and filters
const getBills = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};

    // Role-based filtering
    if (req.user.role === 'shop_owner') {
      query.shopOwner = req.user._id;
    }

    // Customer filter
    if (req.query.customer) {
      query.customer = req.query.customer;
    }

    // Status filter
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      query.billDate = {};

      if (req.query.startDate) {
        query.billDate.$gte = new Date(req.query.startDate);
      }

      if (req.query.endDate) {
        query.billDate.$lte = new Date(req.query.endDate);
      }
    }

    // Bill number search
    if (req.query.billNumber) {
      query.billNumber = {
        $regex: req.query.billNumber,
        $options: 'i'
      };
    }

    // Get bills
    const bills = await Bill.find(query)
      .populate('customer', 'name email mobile')
      .populate('items.medicine', 'medicineName genericName')
      .populate('shopOwner', 'name email')
      .sort({ billDate: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Bill.countDocuments(query);

    res.json({
      success: true,
      data: {
        bills,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get bills error:', error);

    res.status(500).json({
      success: false,
      error: 'Error fetching bills'
    });
  }
};

// Get single bill by ID
const getBillById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = {
      _id: id
    };

    // Role-based filtering
    if (req.user.role === 'shop_owner') {
      query.shopOwner = req.user._id;
    }

    const bill = await Bill.findOne(query)
      .populate('customer', 'name email mobile')
      .populate(
        'items.medicine',
        'medicineName genericName category brand'
      )
      .populate(
        'shopOwner',
        'name email shopDetails'
      );

    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill not found'
      });
    }

    res.json({
      success: true,
      data: {
        bill
      }
    });
  } catch (error) {
    console.error('Get bill error:', error);

    res.status(500).json({
      success: false,
      error: 'Error fetching bill'
    });
  }
};

// Create new bill with stock deduction
const createBill = async (req, res) => {
  const session = await mongoose.startSession();

  session.startTransaction();

  try {
    const {
      customer,
      customerName,
      customerMobile,
      items,
      discount,
      tax,
      paymentMethod,
      notes
    } = req.body;

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        error: 'At least one bill item is required'
      });
    }

    // Validate customer if provided
    if (customer) {
      const customerDoc = await User.findById(customer)
        .session(session);

      if (!customerDoc) {
        await session.abortTransaction();

        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }
    }

    // Validate items and calculate totals
    let subtotal = 0;

    const processedItems = [];

    for (const item of items) {
      // Validate medicine ObjectId
      const idCheck = validateMedicineReference(
        item && item.medicine
      );

      if (!idCheck.isValid) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          error: idCheck.error
        });
      }

      // Validate medicine
      const medicine = await Medicine.findOne({
        _id: item.medicine,
        shopOwner: req.user._id
      }).session(session);

      if (!medicine) {
        await session.abortTransaction();

        return res.status(404).json({
          success: false,
          error: `Medicine not found: ${item.medicine}`
        });
      }

      // Validate quantity
      if (
        !Number.isFinite(Number(item.quantity)) ||
        Number(item.quantity) <= 0
      ) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          error: 'Quantity must be greater than 0'
        });
      }

      // Batch query
      const batchQuery = {
        medicine: item.medicine,
        shopOwner: req.user._id
      };

      if (medicine.enableBatchTracking) {
        batchQuery.batchNumber = item.batchNumber;
      }

      // Validate batch for tracked medicines
      // Untracked medicines use Medicine.stock
      const batch = medicine.enableBatchTracking
        ? await Batch.findOne(batchQuery).session(session)
        : null;

      // Batch not found
      if (medicine.enableBatchTracking && !batch) {
        await session.abortTransaction();

        return res.status(404).json({
          success: false,
          error: `Batch not found: ${item.batchNumber}`
        });
      }

      // =========================================================
      // FIXED EXPIRY CHECK
      // Expiry date ke poore din tak medicine sell hogi.
      // Example:
      // expiryDate = 26-09-2026
      // 26-09-2026 11:59 PM tak valid
      // 27-09-2026 se expired
      // =========================================================
      if (batch && batch.expiryDate) {
        const expiryDate = new Date(batch.expiryDate);

        // Expiry date ke end of day tak valid rakho
        expiryDate.setHours(23, 59, 59, 999);

        const currentDate = new Date();

        if (expiryDate < currentDate) {
          await session.abortTransaction();

          return res.status(400).json({
            success: false,
            error: `Batch ${item.batchNumber} is expired and cannot be sold`
          });
        }
      }

      // Check sufficient quantity
      const availableStock = batch
        ? Number(batch.quantity)
        : Number(medicine.stock);

      if (availableStock < Number(item.quantity)) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          error: 'Insufficient stock.'
        });
      }

      // Validate unit price
      if (
        !Number.isFinite(Number(item.unitPrice)) ||
        Number(item.unitPrice) <= 0
      ) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          error: 'Unit price must be greater than 0'
        });
      }

      // Calculate line values
      const itemQuantity = Number(item.quantity);
      const itemUnitPrice = Number(item.unitPrice);
      const itemDiscount = Number(item.discount || 0);

      const itemTax = Number(
        item.tax !== undefined
          ? item.tax
          : medicine.gst || 0
      );

      // Validate discount
      if (itemDiscount < 0) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          error: 'Item discount cannot be negative'
        });
      }

      // Validate tax
      if (itemTax < 0) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          error: 'Item tax cannot be negative'
        });
      }

      const lineSubtotal =
        (itemQuantity * itemUnitPrice) - itemDiscount;

      if (lineSubtotal < 0) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          error: 'Item discount cannot be greater than item total'
        });
      }

      const lineTax =
        lineSubtotal * (itemTax / 100);

      const lineTotal =
        lineSubtotal + lineTax;

      // Add processed item
      processedItems.push({
        medicine: item.medicine,
        medicineNameSnapshot: medicine.medicineName,
        batchNumber: item.batchNumber || '',
        quantity: itemQuantity,
        unitPrice: itemUnitPrice,
        discount: itemDiscount,
        tax: itemTax,
        lineTotal
      });

      // Subtotal before bill-level discount
      subtotal += itemQuantity * itemUnitPrice;
    }

    // =========================================================
    // FINAL TOTALS
    // =========================================================

    const totalDiscount = Number(discount || 0);

    const totalTax = processedItems.reduce(
      (sum, item) => {
        const lineSubtotal =
          (item.quantity * item.unitPrice) -
          item.discount;

        return (
          sum +
          (lineSubtotal * (item.tax / 100))
        );
      },
      0
    );

    // Validate bill discount
    if (
      totalDiscount < 0 ||
      totalDiscount > subtotal
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        error: 'Invalid discount'
      });
    }

    const grandTotal =
      subtotal -
      totalDiscount +
      totalTax;

    // =========================================================
    // GENERATE BILL NUMBER
    // =========================================================

    const billNumber =
      `BILL-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`;

    // =========================================================
    // CREATE BILL
    // =========================================================

    const bill = await Bill.create(
      [
        {
          billNumber,
          customer,
          customerName,
          customerMobile,
          items: processedItems,
          subtotal,
          discount: totalDiscount,
          tax: totalTax,
          grandTotal,
          paymentMethod,
          notes,
          shopOwner: req.user._id
        }
      ],
      {
        session
      }
    );

    // =========================================================
    // DEDUCT STOCK
    // =========================================================

    for (const item of items) {
      const medicine = await Medicine.findOne({
        _id: item.medicine,
        shopOwner: req.user._id
      }).session(session);

      if (!medicine) {
        throw new Error(
          `Medicine not found while deducting stock: ${item.medicine}`
        );
      }

      const quantity = Number(item.quantity);

      // Deduct medicine stock
      medicine.stock -= quantity;

      // Prevent negative stock
      if (medicine.stock < 0) {
        medicine.stock = 0;
      }

      // Batch tracking
      if (medicine.enableBatchTracking) {
        const embeddedBatch = medicine.batches.find(
          (batch) =>
            batch.batchNumber === item.batchNumber
        );

        if (!embeddedBatch) {
          throw new Error(
            `Embedded batch not found: ${item.batchNumber}`
          );
        }

        // Deduct embedded batch stock
        embeddedBatch.stock -= quantity;

        // Prevent negative embedded stock
        if (embeddedBatch.stock < 0) {
          embeddedBatch.stock = 0;
        }

        // Deduct legacy Batch collection stock
        const batch = await Batch.findOne({
          medicine: item.medicine,
          batchNumber: item.batchNumber,
          shopOwner: req.user._id
        }).session(session);

        if (!batch) {
          throw new Error(
            `Batch not found while deducting stock: ${item.batchNumber}`
          );
        }

        batch.quantity -= quantity;

        // Prevent negative batch quantity
        if (batch.quantity < 0) {
          batch.quantity = 0;
        }

        await batch.save({
          session
        });
      }

      await medicine.save({
        session
      });
    }

    // =========================================================
    // COMMIT TRANSACTION
    // =========================================================

    await session.commitTransaction();

    // =========================================================
    // AUDIT LOG
    // =========================================================

    await createAuditLog({
      user: req.user._id,
      role: req.user.role,
      action: 'bill_created',
      resource: 'Bill',
      resourceId: bill[0]._id,
      metadata: {
        billNumber,
        customer: customerName || customer,
        grandTotal,
        itemCount: items.length
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // =========================================================
    // RESPONSE
    // =========================================================

    return res.status(201).json({
      success: true,
      data: {
        bill: bill[0]
      }
    });
  } catch (error) {
    // Abort only if transaction is still active
    try {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
    } catch (abortError) {
      console.error(
        'Transaction abort error:',
        abortError
      );
    }

    console.error(
      'Create bill error:',
      error
    );

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Bill with this number already exists'
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Error creating bill'
    });
  } finally {
    await session.endSession();
  }
};

// Cancel bill
const cancelBill = async (req, res) => {
  const session = await mongoose.startSession();

  session.startTransaction();

  try {
    const { id } = req.params;

    const query = {
      _id: id
    };

    // Role-based filtering
    if (req.user.role === 'shop_owner') {
      query.shopOwner = req.user._id;
    }

    const bill = await Bill.findOne(query)
      .session(session);

    if (!bill) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        error: 'Bill not found'
      });
    }

    if (bill.status === 'cancelled') {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        error: 'Bill is already cancelled'
      });
    }

    // Restore stock to batches
    for (const item of bill.items) {
      const batch = await Batch.findOne({
        medicine: item.medicine,
        batchNumber: item.batchNumber,
        shopOwner: req.user._id
      }).session(session);

      if (batch) {
        batch.quantity += item.quantity;

        await batch.save({
          session
        });
      }

      // Also restore Medicine embedded stock
      const medicine = await Medicine.findOne({
        _id: item.medicine,
        shopOwner: req.user._id
      }).session(session);

      if (medicine) {
        medicine.stock += item.quantity;

        if (
          medicine.enableBatchTracking &&
          Array.isArray(medicine.batches)
        ) {
          const embeddedBatch = medicine.batches.find(
            (medicineBatch) =>
              medicineBatch.batchNumber ===
              item.batchNumber
          );

          if (embeddedBatch) {
            embeddedBatch.stock += item.quantity;
          }
        }

        await medicine.save({
          session
        });
      }
    }

    // Update bill status
    bill.status = 'cancelled';

    await bill.save({
      session
    });

    await session.commitTransaction();

    // Create audit log
    await createAuditLog({
      user: req.user._id,
      role: req.user.role,
      action: 'bill_cancelled',
      resource: 'Bill',
      resourceId: bill._id,
      metadata: {
        billNumber: bill.billNumber,
        grandTotal: bill.grandTotal
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res.json({
      success: true,
      data: {
        bill
      }
    });
  } catch (error) {
    try {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
    } catch (abortError) {
      console.error(
        'Transaction abort error:',
        abortError
      );
    }

    console.error(
      'Cancel bill error:',
      error
    );

    return res.status(500).json({
      success: false,
      error: 'Error cancelling bill'
    });
  } finally {
    await session.endSession();
  }
};

module.exports = {
  getBills,
  getBillById,
  createBill,
  cancelBill
};