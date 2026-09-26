const { Purchase, Batch, Medicine, Supplier } = require('../models');
const { createAuditLog } = require('../services/auditService');
const mongoose = require('mongoose');

// Get all purchases with pagination
const getPurchases = async (req, res) => {
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
    
    // Supplier filter
    if (req.query.supplier) {
      query.supplier = req.query.supplier;
    }
    
    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      query.purchaseDate = {};
      if (req.query.startDate) {
        query.purchaseDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.purchaseDate.$lte = new Date(req.query.endDate);
      }
    }
    
    // Get purchases
    const purchases = await Purchase.find(query)
      .populate('supplier', 'name mobile email')
      .populate('items.medicine', 'medicineName genericName')
      .populate('shopOwner', 'name email')
      .sort({ purchaseDate: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count
    const total = await Purchase.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        purchases,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching purchases'
    });
  }
};

// Get single purchase by ID
const getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = { _id: id };
    
    // Role-based filtering
    if (req.user.role === 'shop_owner') {
      query.shopOwner = req.user._id;
    }
    
    const purchase = await Purchase.findOne(query)
      .populate('supplier', 'name mobile email address gstNumber')
      .populate('items.medicine', 'medicineName genericName mrp defaultPrice')
      .populate('shopOwner', 'name email');
    
    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: 'Purchase not found'
      });
    }
    
    res.json({
      success: true,
      data: { purchase }
    });
  } catch (error) {
    console.error('Get purchase error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching purchase'
    });
  }
};

// Create new purchase
const createPurchase = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { invoiceNumber, supplier, items, paymentMethod, paymentStatus, notes } = req.body;
    
    // Validate supplier
    const supplierDoc = await Supplier.findOne({
      _id: supplier,
      shopOwner: req.user._id
    }).session(session);
    
    if (!supplierDoc) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: 'Supplier not found or does not belong to your shop'
      });
    }
    
    // Calculate totals and validate items
    let subtotal = 0;
    let totalTax = 0;
    
    for (const item of items) {
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
      
      // Calculate line total
      const lineTotal = item.quantity * item.purchasePrice;
      const lineTax = lineTotal * (item.tax / 100);
      
      item.lineTotal = lineTotal + lineTax;
      subtotal += lineTotal;
      totalTax += lineTax;
    }
    
    const total = subtotal + totalTax;
    
    // Create purchase
    const purchase = await Purchase.create([{
      invoiceNumber,
      supplier,
      items,
      subtotal,
      tax: totalTax,
      total,
      paymentMethod,
      paymentStatus,
      notes,
      shopOwner: req.user._id
    }], { session });
    
    // Update or create batches for each item
    for (const item of items) {
      // Check if batch already exists
      let batch = await Batch.findOne({
        medicine: item.medicine,
        batchNumber: item.batchNumber,
        shopOwner: req.user._id
      }).session(session);
      
      if (batch) {
        // Update existing batch quantity
        batch.quantity += item.quantity;
        batch.purchasePrice = item.purchasePrice; // Update to latest purchase price
        await batch.save({ session });
      } else {
        // Create new batch
        batch = await Batch.create([{
          medicine: item.medicine,
          batchNumber: item.batchNumber,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
          manufacturingDate: item.manufacturingDate,
          expiryDate: item.expiryDate,
          supplier,
          shopOwner: req.user._id
        }], { session });
      }
    }
    
    await session.commitTransaction();
    
    // Create audit log
    await createAuditLog({
      user: req.user._id,
      role: req.user.role,
      action: 'purchase_created',
      resource: 'Purchase',
      resourceId: purchase[0]._id,
      metadata: { 
        invoiceNumber,
        supplier: supplierDoc.name,
        total,
        itemCount: items.length
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.status(201).json({
      success: true,
      data: { purchase: purchase[0] }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Create purchase error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Purchase with this invoice number already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error creating purchase'
    });
  } finally {
    session.endSession();
  }
};

module.exports = {
  getPurchases,
  getPurchaseById,
  createPurchase
};
