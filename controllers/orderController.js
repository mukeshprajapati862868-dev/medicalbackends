// const { Order, Medicine, User, Batch } = require('../models');
// const { createAuditLog } = require('../services/auditService');
// const { validateMedicineReference } = require('../utils/objectIdValidation');

// // Get all orders with pagination and filters
// const getOrders = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 20;
//     const skip = (page - 1) * limit;
    
//     // Build query
//     const query = {};
    
//     // Role-based filtering
//     if (req.user.role === 'customer') {
//       query.customer = req.user._id;
//     } else if (req.user.role === 'shop_owner') {
//       query.shopOwner = req.user._id;
//     }
    
//     // Status filter
//     if (req.query.status) {
//       query.status = req.query.status;
//     }
    
//     // Date range filter
//     if (req.query.startDate || req.query.endDate) {
//       query.createdAt = {};
//       if (req.query.startDate) {
//         query.createdAt.$gte = new Date(req.query.startDate);
//       }
//       if (req.query.endDate) {
//         query.createdAt.$lte = new Date(req.query.endDate);
//       }
//     }
    
//     // Order number search
//     if (req.query.orderNumber) {
//       query.orderNumber = { $regex: req.query.orderNumber, $options: 'i' };
//     }
    
//     // Get orders
//     const orders = await Order.find(query)
//       .populate('customer', 'name email mobile')
//       .populate('items.medicine', 'medicineName genericName')
//       .populate('shopOwner', 'name email')
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);
    
//     // Get total count
//     const total = await Order.countDocuments(query);
    
//     res.json({
//       success: true,
//       data: {
//         orders,
//         pagination: {
//           page,
//           limit,
//           total,
//           pages: Math.ceil(total / limit)
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Get orders error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Error fetching orders'
//     });
//   }
// };

// // Get single order by ID
// const getOrderById = async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     const query = { _id: id };
    
//     // Role-based filtering
//     if (req.user.role === 'customer') {
//       query.customer = req.user._id;
//     } else if (req.user.role === 'shop_owner') {
//       query.shopOwner = req.user._id;
//     }
    
//     const order = await Order.findOne(query)
//       .populate('customer', 'name email mobile')
//       .populate('items.medicine', 'medicineName genericName category brand')
//       .populate('shopOwner', 'name email shopDetails');
    
//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         error: 'Order not found'
//       });
//     }
    
//     res.json({
//       success: true,
//       data: { order }
//     });
//   } catch (error) {
//     console.error('Get order error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Error fetching order'
//     });
//   }
// };

// // Create new order
// // const createOrder = async (req, res) => {
// //   try {
// //     const { items, deliveryType, deliveryAddress, notes, paymentMethod, paymentStatus } = req.body;

// //     if (!Array.isArray(items) || items.length === 0) {
// //       return res.status(400).json({
// //         success: false,
// //         error: 'At least one medicine is required for an order'
// //       });
// //     }

// //     let subtotal = 0;
// //     const processedItems = [];
// //     let shopOwnerId = null;

// //     for (const item of items) {
// //       const idCheck = validateMedicineReference(item && item.medicine);
// //       if (!idCheck.isValid) {
// //         return res.status(400).json({
// //           success: false,
// //           error: idCheck.error
// //         });
// //       }

// //       if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
// //         return res.status(400).json({
// //           success: false,
// //           error: 'Quantity must be a positive integer'
// //         });
// //       }

// //       const medicine = await Medicine.findOne({
// //         _id: item.medicine,
// //         status: 'active'
// //       });

// //       if (!medicine) {
// //         return res.status(404).json({
// //           success: false,
// //           error: `Medicine not found or inactive: ${item.medicine}`
// //         });
// //       }

// //       const medicineShopOwner = medicine.shopOwner?.toString ? medicine.shopOwner.toString() : medicine.shopOwner;
// //       if (!shopOwnerId) {
// //         shopOwnerId = medicineShopOwner;
// //       }

// //       if (shopOwnerId !== medicineShopOwner) {
// //         return res.status(400).json({
// //           success: false,
// //           error: 'Orders cannot include medicines from multiple shop owners.'
// //         });
// //       }

// //       const availableBatches = await Batch.find({
// //         medicine: medicine._id,
// //         shopOwner: medicine.shopOwner,
// //         quantity: { $gt: 0 },
// //         expiryDate: { $gt: new Date() }
// //       }).sort({ expiryDate: 1 });

// //       const totalAvailable = availableBatches.reduce((sum, batch) => sum + batch.quantity, 0);
// //       if (item.quantity > totalAvailable) {
// //         return res.status(400).json({
// //           success: false,
// //           error: `Insufficient stock for ${medicine.medicineName}. Available: ${totalAvailable}, Requested: ${item.quantity}`
// //         });
// //       }

// //       const unitPrice = Number(medicine.defaultPrice || medicine.mrp || 0);
// //       if (!unitPrice || unitPrice <= 0) {
// //         return res.status(400).json({
// //           success: false,
// //           error: `Invalid price for medicine: ${medicine.medicineName}`
// //         });
// //       }

// //       const lineTotal = Number((item.quantity * unitPrice).toFixed(2));
// //       processedItems.push({
// //         medicine: medicine._id,
// //         medicineNameSnapshot: medicine.medicineName,
// //         quantity: item.quantity,
// //         unitPrice,
// //         lineTotal
// //       });

// //       subtotal += lineTotal;
// //     }

// //     const totalDiscount = Number(req.body.discount || 0);
// //     const totalTax = Number(req.body.tax || 0);
// //     const grandTotal = Number((subtotal - totalDiscount + totalTax).toFixed(2));
// //     const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

// //     const order = await Order.create({
// //       orderNumber,
// //       customer: req.user._id,
// //       items: processedItems,
// //       subtotal: Number(subtotal.toFixed(2)),
// //       discount: totalDiscount,
// //       tax: totalTax,
// //       grandTotal,
// //       deliveryType,
// //       deliveryAddress,
// //       notes,
// //       paymentMethod: paymentMethod || 'cash',
// //       paymentStatus: paymentStatus || 'pending',
// //       shopOwner: shopOwnerId
// //     });

// //     for (const item of processedItems) {
// //       let remaining = item.quantity;
// //       const batches = await Batch.find({
// //         medicine: item.medicine,
// //         shopOwner: shopOwnerId,
// //         quantity: { $gt: 0 },
// //         expiryDate: { $gt: new Date() }
// //       }).sort({ expiryDate: 1 });

// //       for (const batch of batches) {
// //         if (remaining <= 0) break;
// //         const deduct = Math.min(batch.quantity, remaining);
// //         batch.quantity -= deduct;
// //         remaining -= deduct;
// //         await batch.save();
// //       }

// //       if (remaining > 0) {
// //         throw new Error(`Stock mismatch for medicine ${item.medicine}`);
// //       }
// //     }

// //     await createAuditLog({
// //       user: req.user._id,
// //       role: req.user.role,
// //       action: 'order_created',
// //       resource: 'Order',
// //       resourceId: order._id,
// //       metadata: {
// //         orderNumber,
// //         customer: req.user.name,
// //         grandTotal,
// //         itemCount: items.length
// //       },
// //       ipAddress: req.ip,
// //       userAgent: req.get('user-agent')
// //     });

// //     res.status(201).json({
// //       success: true,
// //       data: { order }
// //     });
// //   } catch (error) {
// //     console.error('Create order error:', error);
// //     res.status(500).json({
// //       success: false,
// //       error: error.message || 'Error creating order'
// //     });
// //   }
// // };

// // // Update order status
// // const updateOrderStatus = async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     const { status, paymentStatus } = req.body;
    
// //     const query = { _id: id };
    
// //     // Role-based filtering
// //     if (req.user.role === 'shop_owner') {
// //       query.shopOwner = req.user._id;
// //     }
    
// //     const order = await Order.findOne(query);
    
// //     if (!order) {
// //       return res.status(404).json({
// //         success: false,
// //         error: 'Order not found'
// //       });
// //     }
    
// //     // Validate status transition
// //     const validStatuses = ['pending', 'confirmed', 'processing', 'ready', 'delivered', 'completed', 'cancelled'];
// //     if (status && !validStatuses.includes(status)) {
// //       return res.status(400).json({
// //         success: false,
// //         error: 'Invalid status'
// //       });
// //     }
    
// //     // Update order
// //     if (status) order.status = status;
// //     if (paymentStatus) order.paymentStatus = paymentStatus;
    
// //     await order.save();
    
// //     // Create audit log
// //     await createAuditLog({
// //       user: req.user._id,
// //       role: req.user.role,
// //       action: 'order_updated',
// //       resource: 'Order',
// //       resourceId: order._id,
// //       metadata: { 
// //         orderNumber: order.orderNumber,
// //         status: order.status,
// //         paymentStatus: order.paymentStatus
// //       },
// //       ipAddress: req.ip,
// //       userAgent: req.get('user-agent')
// //     });
    
// //     res.json({
// //       success: true,
// //       data: { order }
// //     });
// //   } catch (error) {
// //     console.error('Update order status error:', error);
// //     res.status(500).json({
// //       success: false,
// //       error: 'Error updating order status'
// //     });
// //   }
// // };

// // // Cancel order
// // const cancelOrder = async (req, res) => {
// //   try {
// //     const { id } = req.params;
    
// //     const query = { _id: id };
    
// //     // Role-based filtering
// //     if (req.user.role === 'customer') {
// //       query.customer = req.user._id;
// //     } else if (req.user.role === 'shop_owner') {
// //       query.shopOwner = req.user._id;
// //     }
    
// //     const order = await Order.findOne(query);
    
// //     if (!order) {
// //       return res.status(404).json({
// //         success: false,
// //         error: 'Order not found'
// //       });
// //     }
    
// //     if (order.status === 'cancelled') {
// //       return res.status(400).json({
// //         success: false,
// //         error: 'Order is already cancelled'
// //       });
// //     }
    
// //     if (order.status === 'completed' || order.status === 'delivered') {
// //       return res.status(400).json({
// //         success: false,
// //         error: 'Cannot cancel completed order'
// //       });
// //     }
    
// //     order.status = 'cancelled';
// //     await order.save();
    
// //     // Create audit log
// //     await createAuditLog({
// //       user: req.user._id,
// //       role: req.user.role,
// //       action: 'order_cancelled',
// //       resource: 'Order',
// //       resourceId: order._id,
// //       metadata: { 
// //         orderNumber: order.orderNumber,
// //         grandTotal: order.grandTotal
// //       },
// //       ipAddress: req.ip,
// //       userAgent: req.get('user-agent')
// //     });
    
// //     res.json({
// //       success: true,
// //       data: { order }
// //     });
// //   } catch (error) {
// //     console.error('Cancel order error:', error);
// //     res.status(500).json({
// //       success: false,
// //       error: 'Error cancelling order'
// //     });
// //   }
// // };

// // module.exports = {
// //   getOrders,
// //   getOrderById,
// //   createOrder,
// //   updateOrderStatus,
// //   cancelOrder
// // };
// // Create new order
// const createOrder = async (req, res) => {
//   try {
//     const {
//       items,
//       deliveryType,
//       deliveryAddress,
//       notes,
//       paymentMethod,
//       paymentStatus,
//       discount,
//       tax,
//     } = req.body;

//     // -----------------------------------------
//     // Validate items
//     // -----------------------------------------
//     if (!Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({
//         success: false,
//         error: 'At least one medicine is required for an order',
//       });
//     }

//     let subtotal = 0;
//     const processedItems = [];
//     let shopOwnerId = null;

//     // -----------------------------------------
//     // Check every medicine
//     // -----------------------------------------
//     for (const item of items) {
//       const idCheck = validateMedicineReference(
//         item && item.medicine
//       );

//       if (!idCheck.isValid) {
//         return res.status(400).json({
//           success: false,
//           error: idCheck.error,
//         });
//       }

//       const quantity = Number(item.quantity);

//       if (
//         !Number.isInteger(quantity) ||
//         quantity <= 0
//       ) {
//         return res.status(400).json({
//           success: false,
//           error: 'Quantity must be a positive integer',
//         });
//       }

//       // -----------------------------------------
//       // Find medicine
//       // IMPORTANT:
//       // Stock is taken from Medicine.stock
//       // -----------------------------------------
//       const medicine = await Medicine.findOne({
//         _id: item.medicine,
//         status: 'active',
//       });

//       if (!medicine) {
//         return res.status(404).json({
//           success: false,
//           error: `Medicine not found or inactive: ${item.medicine}`,
//         });
//       }

//       // -----------------------------------------
//       // Shop owner check
//       // -----------------------------------------
//       const medicineShopOwner =
//         medicine.shopOwner?.toString
//           ? medicine.shopOwner.toString()
//           : String(medicine.shopOwner);

//       if (!shopOwnerId) {
//         shopOwnerId = medicineShopOwner;
//       }

//       if (shopOwnerId !== medicineShopOwner) {
//         return res.status(400).json({
//           success: false,
//           error:
//             'Orders cannot include medicines from multiple shop owners.',
//         });
//       }

//       // -----------------------------------------
//       // IMPORTANT:
//       // Use Medicine.stock
//       // -----------------------------------------
//       const availableStock = Number(
//         medicine.stock || 0
//       );

//       if (availableStock <= 0) {
//         return res.status(400).json({
//           success: false,
//           error: `Insufficient stock for ${medicine.medicineName}. Available: 0, Requested: ${quantity}`,
//         });
//       }

//       if (quantity > availableStock) {
//         return res.status(400).json({
//           success: false,
//           error: `Insufficient stock for ${medicine.medicineName}. Available: ${availableStock}, Requested: ${quantity}`,
//         });
//       }

//       // -----------------------------------------
//       // Price
//       // -----------------------------------------
//       const unitPrice = Number(
//         medicine.defaultPrice ||
//         medicine.mrp ||
//         0
//       );

//       if (!unitPrice || unitPrice <= 0) {
//         return res.status(400).json({
//           success: false,
//           error:
//             `Invalid price for medicine: ${medicine.medicineName}`,
//         });
//       }

//       // -----------------------------------------
//       // Line total
//       // -----------------------------------------
//       const lineTotal = Number(
//         (quantity * unitPrice).toFixed(2)
//       );

//       processedItems.push({
//         medicine: medicine._id,
//         medicineNameSnapshot:
//           medicine.medicineName,
//         quantity,
//         unitPrice,
//         lineTotal,
//       });

//       subtotal += lineTotal;
//     }

//     // -----------------------------------------
//     // Discount / Tax
//     // -----------------------------------------
//     const totalDiscount = Number(
//       discount || 0
//     );

//     const totalTax = Number(
//       tax || 0
//     );

//     const grandTotal = Number(
//       (
//         subtotal -
//         totalDiscount +
//         totalTax
//       ).toFixed(2)
//     );

//     // -----------------------------------------
//     // Generate order number
//     // -----------------------------------------
//     const orderNumber =
//       `ORD-${Date.now()}-${Math.random()
//         .toString(36)
//         .substr(2, 9)
//         .toUpperCase()}`;

//     // -----------------------------------------
//     // Create order
//     // -----------------------------------------
//     const order = await Order.create({
//       orderNumber,

//       customer: req.user._id,

//       items: processedItems,

//       subtotal: Number(
//         subtotal.toFixed(2)
//       ),

//       discount: totalDiscount,

//       tax: totalTax,

//       grandTotal,

//       deliveryType,

//       deliveryAddress,

//       notes,

//       paymentMethod:
//         paymentMethod || 'cash',

//       paymentStatus:
//         paymentStatus || 'pending',

//       shopOwner: shopOwnerId,
//     });

//     // -----------------------------------------
//     // DEDUCT STOCK FROM MEDICINE
//     // -----------------------------------------
//     for (const item of processedItems) {
//       const updatedMedicine =
//         await Medicine.findOneAndUpdate(
//           {
//             _id: item.medicine,
//             status: 'active',

//             // Prevent negative stock
//             stock: {
//               $gte: item.quantity,
//             },
//           },
//           {
//             $inc: {
//               stock: -item.quantity,
//             },
//           },
//           {
//             new: true,
//           }
//         );

//       // -----------------------------------------
//       // Stock changed between validation
//       // and deduction
//       // -----------------------------------------
//       if (!updatedMedicine) {
//         // Delete order because stock deduction failed
//         await Order.findByIdAndDelete(
//           order._id
//         );

//         return res.status(400).json({
//           success: false,
//           error:
//             `Stock changed for ${item.medicineNameSnapshot}. Please try checkout again.`,
//         });
//       }
//     }

//     // -----------------------------------------
//     // Audit log
//     // -----------------------------------------
//     await createAuditLog({
//       user: req.user._id,
//       role: req.user.role,
//       action: 'order_created',
//       resource: 'Order',
//       resourceId: order._id,

//       metadata: {
//         orderNumber,
//         customer: req.user.name,
//         grandTotal,
//         itemCount: items.length,
//       },

//       ipAddress: req.ip,
//       userAgent: req.get('user-agent'),
//     });

//     // -----------------------------------------
//     // Response
//     // -----------------------------------------
//     return res.status(201).json({
//       success: true,

//       data: {
//         order,
//       },

//       message:
//         'Order placed successfully',
//     });
//   } catch (error) {
//     console.error(
//       'Create order error:',
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       error:
//         error.message ||
//         'Error creating order',
//     });
//   }
// };
const {
  Order,
  Medicine,
  User,
} = require('../models');

const {
  createAuditLog,
} = require('../services/auditService');

const {
  validateMedicineReference,
} = require('../utils/objectIdValidation');


// ============================================================
// GET ALL ORDERS
// ============================================================

const getOrders = async (req, res) => {
  try {
    const page =
      parseInt(req.query.page) || 1;

    const limit =
      parseInt(req.query.limit) || 20;

    const skip =
      (page - 1) * limit;

    const query = {};

    // Customer can see only own orders
    if (req.user.role === 'customer') {
      query.customer = req.user._id;
    }

    // Shop owner can see only own shop orders
    else if (
      req.user.role === 'shop_owner'
    ) {
      query.shopOwner = req.user._id;
    }

    // Status filter
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Date filter
    if (
      req.query.startDate ||
      req.query.endDate
    ) {
      query.createdAt = {};

      if (req.query.startDate) {
        query.createdAt.$gte =
          new Date(
            req.query.startDate
          );
      }

      if (req.query.endDate) {
        query.createdAt.$lte =
          new Date(
            req.query.endDate
          );
      }
    }

    // Order number search
    if (req.query.orderNumber) {
      query.orderNumber = {
        $regex: req.query.orderNumber,
        $options: 'i',
      };
    }

    const orders =
      await Order.find(query)
        .populate(
          'customer',
          'name email mobile'
        )
        .populate(
          'items.medicine',
          'medicineName genericName'
        )
        .populate(
          'shopOwner',
          'name email'
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit);

    const total =
      await Order.countDocuments(query);

    return res.json({
      success: true,

      data: {
        orders,

        pagination: {
          page,
          limit,
          total,
          pages:
            Math.ceil(
              total / limit
            ),
        },
      },
    });
  } catch (error) {
    console.error(
      'Get orders error:',
      error
    );

    return res.status(500).json({
      success: false,
      error: 'Error fetching orders',
    });
  }
};


// ============================================================
// GET SINGLE ORDER
// ============================================================

const getOrderById = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const query = {
      _id: id,
    };

    // Customer restriction
    if (req.user.role === 'customer') {
      query.customer =
        req.user._id;
    }

    // Shop owner restriction
    else if (
      req.user.role === 'shop_owner'
    ) {
      query.shopOwner =
        req.user._id;
    }

    const order =
      await Order.findOne(query)
        .populate(
          'customer',
          'name email mobile'
        )
        .populate(
          'items.medicine',
          'medicineName genericName category brand'
        )
        .populate(
          'shopOwner',
          'name email shopDetails'
        );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    return res.json({
      success: true,

      data: {
        order,
      },
    });
  } catch (error) {
    console.error(
      'Get order error:',
      error
    );

    return res.status(500).json({
      success: false,
      error: 'Error fetching order',
    });
  }
};


// ============================================================
// CREATE ORDER
// ============================================================

const createOrder = async (
  req,
  res
) => {
  try {
    const {
      items,
      deliveryType,
      deliveryAddress,
      notes,
      paymentMethod,
      paymentStatus,
    } = req.body;

    // --------------------------------------------------------
    // Validate items
    // --------------------------------------------------------

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error:
          'At least one medicine is required for an order',
      });
    }

    let subtotal = 0;

    const processedItems = [];

    let shopOwnerId = null;


    // --------------------------------------------------------
    // Validate every medicine
    // --------------------------------------------------------

    for (const item of items) {
      const idCheck =
        validateMedicineReference(
          item &&
            item.medicine
        );

      if (!idCheck.isValid) {
        return res.status(400).json({
          success: false,
          error: idCheck.error,
        });
      }


      // ------------------------------------------------------
      // Validate quantity
      // ------------------------------------------------------

      const quantity =
        Number(item.quantity);

      if (
        !Number.isInteger(
          quantity
        ) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Quantity must be a positive integer',
        });
      }


      // ------------------------------------------------------
      // Get latest medicine from MongoDB
      // ------------------------------------------------------

      const medicine =
        await Medicine.findOne({
          _id: item.medicine,
          status: 'active',
        });

      if (!medicine) {
        return res.status(404).json({
          success: false,
          error:
            `Medicine not found or inactive: ${item.medicine}`,
        });
      }


      // ------------------------------------------------------
      // Shop owner
      // ------------------------------------------------------

      const medicineShopOwner =
        medicine.shopOwner?.toString
          ? medicine.shopOwner.toString()
          : medicine.shopOwner;


      if (!shopOwnerId) {
        shopOwnerId =
          medicineShopOwner;
      }


      // ------------------------------------------------------
      // Don't allow multiple shops
      // ------------------------------------------------------

      if (
        shopOwnerId !==
        medicineShopOwner
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Orders cannot include medicines from multiple shop owners.',
        });
      }


      // ------------------------------------------------------
      // IMPORTANT:
      //
      // Current stock comes directly from Medicine collection.
      //
      // Example:
      // Medicine.stock = 200
      // Requested = 1
      //
      // 1 <= 200 => allowed
      // ------------------------------------------------------

      const availableStock =
        Number(
          medicine.stock || 0
        );


      console.log(
        'ORDER STOCK CHECK:',
        {
          medicine:
            medicine.medicineName,

          databaseStock:
            availableStock,

          requestedQuantity:
            quantity,
        }
      );


      // ------------------------------------------------------
      // Stock validation
      // ------------------------------------------------------

      if (
        quantity >
        availableStock
      ) {
        return res.status(400).json({
          success: false,

          error:
            `Insufficient stock for ${medicine.medicineName}. Available: ${availableStock}, Requested: ${quantity}`,
        });
      }


      // ------------------------------------------------------
      // Price
      // ------------------------------------------------------

      const unitPrice =
        Number(
          medicine.defaultPrice ||
            medicine.mrp ||
            0
        );

      if (
        !unitPrice ||
        unitPrice <= 0
      ) {
        return res.status(400).json({
          success: false,
          error:
            `Invalid price for medicine: ${medicine.medicineName}`,
        });
      }


      // ------------------------------------------------------
      // Line total
      // ------------------------------------------------------

      const lineTotal =
        Number(
          (
            quantity *
            unitPrice
          ).toFixed(2)
        );


      processedItems.push({
        medicine:
          medicine._id,

        medicineNameSnapshot:
          medicine.medicineName,

        quantity,

        unitPrice,

        lineTotal,
      });


      subtotal += lineTotal;
    }


    // --------------------------------------------------------
    // Discount
    // --------------------------------------------------------

    const totalDiscount =
      Number(
        req.body.discount || 0
      );


    // --------------------------------------------------------
    // Tax
    // --------------------------------------------------------

    const totalTax =
      Number(
        req.body.tax || 0
      );


    // --------------------------------------------------------
    // Grand total
    // --------------------------------------------------------

    const grandTotal =
      Number(
        (
          subtotal -
          totalDiscount +
          totalTax
        ).toFixed(2)
      );


    // --------------------------------------------------------
    // Generate order number
    // --------------------------------------------------------

    const orderNumber =
      `ORD-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`;


    // --------------------------------------------------------
    // Create order
    // --------------------------------------------------------

    const order =
      await Order.create({
        orderNumber,

        customer:
          req.user._id,

        items:
          processedItems,

        subtotal:
          Number(
            subtotal.toFixed(2)
          ),

        discount:
          totalDiscount,

        tax:
          totalTax,

        grandTotal,

        deliveryType,

        deliveryAddress,

        notes,

        paymentMethod:
          paymentMethod ||
          'cash',

        paymentStatus:
          paymentStatus ||
          'pending',

        shopOwner:
          shopOwnerId,
      });


    // --------------------------------------------------------
    // Deduct Medicine.stock
    // --------------------------------------------------------

    for (
      const item of processedItems
    ) {
      const updatedMedicine =
        await Medicine.findOneAndUpdate(
          {
            _id:
              item.medicine,

            status:
              'active',

            /*
             * Important:
             * Prevent negative stock.
             */
            stock: {
              $gte:
                item.quantity,
            },
          },

          {
            $inc: {
              stock:
                -item.quantity,
            },
          },

          {
            new: true,
          }
        );


      // ------------------------------------------------------
      // Stock changed between validation and update
      // ------------------------------------------------------

      if (!updatedMedicine) {
        /*
         * Remove order because stock
         * could not be deducted.
         */
        await Order.findByIdAndDelete(
          order._id
        );

        return res.status(400).json({
          success: false,

          error:
            `Stock changed while placing order for ${item.medicineNameSnapshot}. Please try again.`,
        });
      }


      console.log(
        'STOCK DEDUCTED:',
        {
          medicine:
            item.medicineNameSnapshot,

          sold:
            item.quantity,

          remainingStock:
            updatedMedicine.stock,
        }
      );
    }


    // --------------------------------------------------------
    // Audit log
    // --------------------------------------------------------

    await createAuditLog({
      user:
        req.user._id,

      role:
        req.user.role,

      action:
        'order_created',

      resource:
        'Order',

      resourceId:
        order._id,

      metadata: {
        orderNumber,

        customer:
          req.user.name,

        grandTotal,

        itemCount:
          items.length,
      },

      ipAddress:
        req.ip,

      userAgent:
        req.get(
          'user-agent'
        ),
    });


    // --------------------------------------------------------
    // Success response
    // --------------------------------------------------------

    return res.status(201).json({
      success: true,

      data: {
        order,
      },
    });
  } catch (error) {
    console.error(
      'Create order error:',
      error
    );

    return res.status(500).json({
      success: false,

      error:
        error.message ||
        'Error creating order',
    });
  }
};


// ============================================================
// UPDATE ORDER STATUS
// ============================================================

const updateOrderStatus = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const {
      status,
      paymentStatus,
    } = req.body;

    const query = {
      _id: id,
    };


    // Shop owner restriction
    if (
      req.user.role ===
      'shop_owner'
    ) {
      query.shopOwner =
        req.user._id;
    }


    const order =
      await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }


    // Valid statuses
    const validStatuses = [
      'pending',
      'confirmed',
      'processing',
      'ready',
      'delivered',
      'completed',
      'cancelled',
    ];


    if (
      status &&
      !validStatuses.includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid status',
      });
    }


    if (status) {
      order.status =
        status;
    }


    if (paymentStatus) {
      order.paymentStatus =
        paymentStatus;
    }


    await order.save();


    await createAuditLog({
      user:
        req.user._id,

      role:
        req.user.role,

      action:
        'order_updated',

      resource:
        'Order',

      resourceId:
        order._id,

      metadata: {
        orderNumber:
          order.orderNumber,

        status:
          order.status,

        paymentStatus:
          order.paymentStatus,
      },

      ipAddress:
        req.ip,

      userAgent:
        req.get(
          'user-agent'
        ),
    });


    return res.json({
      success: true,

      data: {
        order,
      },
    });
  } catch (error) {
    console.error(
      'Update order status error:',
      error
    );

    return res.status(500).json({
      success: false,

      error:
        'Error updating order status',
    });
  }
};


// ============================================================
// CANCEL ORDER
// ============================================================

const cancelOrder = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const query = {
      _id: id,
    };


    // Customer restriction
    if (
      req.user.role ===
      'customer'
    ) {
      query.customer =
        req.user._id;
    }

    // Shop owner restriction
    else if (
      req.user.role ===
      'shop_owner'
    ) {
      query.shopOwner =
        req.user._id;
    }


    const order =
      await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        error:
          'Order not found',
      });
    }


    if (
      order.status ===
      'cancelled'
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Order is already cancelled',
      });
    }


    if (
      order.status ===
        'completed' ||
      order.status ===
        'delivered'
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Cannot cancel completed order',
      });
    }


    // --------------------------------------------------------
    // Restore stock
    // --------------------------------------------------------

    for (
      const item of order.items
    ) {
      const medicine =
        await Medicine.findById(
          item.medicine
        );

      if (medicine) {
        medicine.stock =
          Number(
            medicine.stock || 0
          ) +
          Number(
            item.quantity || 0
          );

        await medicine.save();


        console.log(
          'STOCK RESTORED:',
          {
            medicine:
              medicine.medicineName,

            restored:
              item.quantity,

            currentStock:
              medicine.stock,
          }
        );
      }
    }


    // --------------------------------------------------------
    // Cancel order
    // --------------------------------------------------------

    order.status =
      'cancelled';

    await order.save();


    // --------------------------------------------------------
    // Audit log
    // --------------------------------------------------------

    await createAuditLog({
      user:
        req.user._id,

      role:
        req.user.role,

      action:
        'order_cancelled',

      resource:
        'Order',

      resourceId:
        order._id,

      metadata: {
        orderNumber:
          order.orderNumber,

        grandTotal:
          order.grandTotal,
      },

      ipAddress:
        req.ip,

      userAgent:
        req.get(
          'user-agent'
        ),
    });


    return res.json({
      success: true,

      data: {
        order,
      },
    });
  } catch (error) {
    console.error(
      'Cancel order error:',
      error
    );

    return res.status(500).json({
      success: false,

      error:
        'Error cancelling order',
    });
  }
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder,
};