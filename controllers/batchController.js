const { Batch, Medicine } = require('../models');
const { createAuditLog } = require('../services/auditService');

// Get all batches with pagination and filters
const getBatches = async (req, res) => {
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
    
    // Medicine filter
    if (req.query.medicine) {
      query.medicine = req.query.medicine;
    }
    
    // Status filter
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Near expiry filter
    if (req.query.nearExpiry === 'true') {
      const today = new Date();
      const nearExpiryDays = parseInt(process.env.NEAR_EXPIRY_DAYS) || 30;
      const nearExpiryDate = new Date(today);
      nearExpiryDate.setDate(nearExpiryDate.getDate() + nearExpiryDays);
      
      query.expiryDate = {
        $lte: nearExpiryDate,
        $gt: today
      };
    }
    
    // Expired filter
    if (req.query.expired === 'true') {
      query.expiryDate = { $lt: new Date() };
    }
    
    // Get batches
    const batches = await Batch.find(query)
      .populate('medicine', 'medicineName genericName mrp defaultPrice')
      .populate('supplier', 'name')
      .populate('shopOwner', 'name email')
      .sort({ expiryDate: 1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count
    const total = await Batch.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        batches,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching batches'
    });
  }
};

// Get single batch by ID
const getBatchById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = { _id: id };
    
    // Role-based filtering
    if (req.user.role === 'shop_owner') {
      query.shopOwner = req.user._id;
    }
    
    const batch = await Batch.findOne(query)
      .populate('medicine', 'medicineName genericName mrp defaultPrice category brand')
      .populate('supplier', 'name mobile email')
      .populate('shopOwner', 'name email');
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
    }
    
    res.json({
      success: true,
      data: { batch }
    });
  } catch (error) {
    console.error('Get batch error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching batch'
    });
  }
};

// Create new batch
const createBatch = async (req, res) => {
  try {
    const batchData = {
      ...req.body,
      shopOwner: req.user._id
    };
    
    // Check if medicine exists and belongs to shop owner
    const medicine = await Medicine.findOne({
      _id: batchData.medicine,
      shopOwner: req.user._id
    });
    
    if (!medicine) {
      return res.status(404).json({
        success: false,
        error: 'Medicine not found or does not belong to your shop'
      });
    }
    
    const batch = await Batch.create(batchData);
    
    // Create audit log
    await createAuditLog({
      user: req.user._id,
      role: req.user.role,
      action: 'stock_changed',
      resource: 'Batch',
      resourceId: batch._id,
      metadata: { 
        medicineName: medicine.medicineName,
        batchNumber: batch.batchNumber,
        quantity: batch.quantity,
        action: 'created'
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.status(201).json({
      success: true,
      data: { batch }
    });
  } catch (error) {
    console.error('Create batch error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Batch with this number already exists for this medicine'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error creating batch'
    });
  }
};

// Update batch
const updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = { _id: id };
    
    // Role-based filtering
    if (req.user.role === 'shop_owner') {
      query.shopOwner = req.user._id;
    }
    
    const batch = await Batch.findOne(query);
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
    }
    
    // Store old quantity for audit
    const oldQuantity = batch.quantity;
    
    // Keep batch ownership and medicine association immutable.
    const editableFields = [
      'batchNumber', 'quantity', 'purchasePrice', 'sellingPrice',
      'manufacturingDate', 'expiryDate', 'supplier', 'status'
    ];
    Object.assign(
      batch,
      Object.fromEntries(Object.entries(req.body).filter(([field]) => editableFields.includes(field)))
    );
    await batch.save();
    
    // Create audit log if quantity changed
    if (req.body.quantity !== undefined && req.body.quantity !== oldQuantity) {
      await createAuditLog({
        user: req.user._id,
        role: req.user.role,
        action: 'stock_changed',
        resource: 'Batch',
        resourceId: batch._id,
        metadata: { 
          batchNumber: batch.batchNumber,
          oldQuantity,
          newQuantity: batch.quantity,
          change: batch.quantity - oldQuantity
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
    }
    
    res.json({
      success: true,
      data: { batch }
    });
  } catch (error) {
    console.error('Update batch error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating batch'
    });
  }
};

// Delete batch
const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = { _id: id };
    
    // Role-based filtering
    if (req.user.role === 'shop_owner') {
      query.shopOwner = req.user._id;
    }
    
    const batch = await Batch.findOne(query);
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
    }
    
    // Check if batch has stock
    if (batch.quantity > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete batch with existing stock. Please adjust stock to zero first.'
      });
    }
    
    await Batch.findByIdAndDelete(id);
    
    // Create audit log
    await createAuditLog({
      user: req.user._id,
      role: req.user.role,
      action: 'stock_changed',
      resource: 'Batch',
      resourceId: id,
      metadata: { 
        batchNumber: batch.batchNumber,
        action: 'deleted'
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json({
      success: true,
      data: { message: 'Batch deleted successfully' }
    });
  } catch (error) {
    console.error('Delete batch error:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting batch'
    });
  }
};

// Get inventory summary
const getInventorySummary = async (req, res) => {
  try {
    const query = {};
    
    // Role-based filtering
    if (req.user.role === 'shop_owner') {
      query.shopOwner = req.user._id;
    }
    
    const today = new Date();
    const nearExpiryDays = parseInt(process.env.NEAR_EXPIRY_DAYS) || 30;
    const nearExpiryDate = new Date(today);
    nearExpiryDate.setDate(nearExpiryDate.getDate() + nearExpiryDays);
    
    // Get batch statistics
    const totalBatches = await Batch.countDocuments(query);
    const inStockBatches = await Batch.countDocuments({ ...query, status: 'in_stock' });
    const lowStockBatches = await Batch.countDocuments({ ...query, status: 'low_stock' });
    const outOfStockBatches = await Batch.countDocuments({ ...query, status: 'out_of_stock' });
    const expiredBatches = await Batch.countDocuments({ ...query, status: 'expired' });
    const nearExpiryBatches = await Batch.countDocuments({
      ...query,
      expiryDate: { $lte: nearExpiryDate, $gt: today }
    });
    
    // Get total stock value
    const batches = await Batch.find(query);
    const totalStock = batches.reduce((sum, batch) => sum + batch.quantity, 0);
    const totalStockValue = batches.reduce((sum, batch) => sum + (batch.quantity * batch.purchasePrice), 0);
    
    res.json({
      success: true,
      data: {
        summary: {
          totalBatches,
          inStockBatches,
          lowStockBatches,
          outOfStockBatches,
          expiredBatches,
          nearExpiryBatches,
          totalStock,
          totalStockValue
        }
      }
    });
  } catch (error) {
    console.error('Get inventory summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching inventory summary'
    });
  }
};

module.exports = {
  getBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch,
  getInventorySummary
};
