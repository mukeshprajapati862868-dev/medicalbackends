const { Supplier } = require('../models');
const { createAuditLog } = require('../services/auditService');

// Get all suppliers with pagination
const getSuppliers = async (req, res) => {
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
    
    // Search filter
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { contact: { $regex: req.query.search, $options: 'i' } },
        { mobile: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Status filter
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }
    
    // Get suppliers
    const suppliers = await Supplier.find(query)
      .populate('shopOwner', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count
    const total = await Supplier.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        suppliers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching suppliers'
    });
  }
};

// Get single supplier by ID
const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = { _id: id };
    
    // Role-based filtering
    if (req.user.role === 'shop_owner') {
      query.shopOwner = req.user._id;
    }
    
    const supplier = await Supplier.findOne(query)
      .populate('shopOwner', 'name email');
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }
    
    res.json({
      success: true,
      data: { supplier }
    });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching supplier'
    });
  }
};

// Create new supplier
const createSupplier = async (req, res) => {
  try {
    const supplierData = {
      ...req.body,
      shopOwner: req.user._id
    };
    
    const supplier = await Supplier.create(supplierData);
    
    // Create audit log
    await createAuditLog({
      user: req.user._id,
      role: req.user.role,
      action: 'supplier_created',
      resource: 'Supplier',
      resourceId: supplier._id,
      metadata: { 
        supplierName: supplier.name,
        shopOwner: req.user._id 
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.status(201).json({
      success: true,
      data: { supplier }
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Supplier with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error creating supplier'
    });
  }
};

// Update supplier
const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = { _id: id };
    
    // Role-based filtering
    if (req.user.role === 'shop_owner') {
      query.shopOwner = req.user._id;
    }
    
    const supplier = await Supplier.findOne(query);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }
    
    // Update supplier
    Object.assign(supplier, req.body);
    await supplier.save();
    
    // Create audit log
    await createAuditLog({
      user: req.user._id,
      role: req.user.role,
      action: 'supplier_updated',
      resource: 'Supplier',
      resourceId: supplier._id,
      metadata: { 
        supplierName: supplier.name,
        changes: req.body 
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json({
      success: true,
      data: { supplier }
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating supplier'
    });
  }
};

// Delete supplier
const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = { _id: id };
    
    // Role-based filtering
    if (req.user.role === 'shop_owner') {
      query.shopOwner = req.user._id;
    }
    
    const supplier = await Supplier.findOne(query);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }
    
    await Supplier.findByIdAndDelete(id);
    
    // Create audit log
    await createAuditLog({
      user: req.user._id,
      role: req.user.role,
      action: 'supplier_deleted',
      resource: 'Supplier',
      resourceId: id,
      metadata: { 
        supplierName: supplier.name 
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json({
      success: true,
      data: { message: 'Supplier deleted successfully' }
    });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting supplier'
    });
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
};
