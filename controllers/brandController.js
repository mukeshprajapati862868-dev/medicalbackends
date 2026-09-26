const { Brand } = require('../models');
const { createAuditLog } = require('../services/auditService');

// Get all brands
const getBrands = async (req, res) => {
  try {
    const query = {};
    
    // Status filter
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }
    
    const brands = await Brand.find(query).sort({ name: 1 });
    
    res.json({
      success: true,
      data: { brands }
    });
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching brands'
    });
  }
};

// Get single brand by ID
const getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    
    if (!brand) {
      return res.status(404).json({
        success: false,
        error: 'Brand not found'
      });
    }
    
    res.json({
      success: true,
      data: { brand }
    });
  } catch (error) {
    console.error('Get brand error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching brand'
    });
  }
};

// Create new brand
const createBrand = async (req, res) => {
  try {
    const brand = await Brand.create(req.body);
    
    // Create audit log
    await createAuditLog({
      user: req.user._id,
      role: req.user.role,
      action: 'brand_created',
      resource: 'Brand',
      resourceId: brand._id,
      metadata: { brandName: brand.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.status(201).json({
      success: true,
      data: { brand }
    });
  } catch (error) {
    console.error('Create brand error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Brand with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error creating brand'
    });
  }
};

// Update brand
const updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!brand) {
      return res.status(404).json({
        success: false,
        error: 'Brand not found'
      });
    }
    
    // Create audit log
    await createAuditLog({
      user: req.user._id,
      role: req.user.role,
      action: 'brand_updated',
      resource: 'Brand',
      resourceId: brand._id,
      metadata: { brandName: brand.name, changes: req.body },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json({
      success: true,
      data: { brand }
    });
  } catch (error) {
    console.error('Update brand error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating brand'
    });
  }
};

// Delete brand
const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    
    if (!brand) {
      return res.status(404).json({
        success: false,
        error: 'Brand not found'
      });
    }
    
    // Create audit log
    await createAuditLog({
      user: req.user._id,
      role: req.user.role,
      action: 'brand_deleted',
      resource: 'Brand',
      resourceId: req.params.id,
      metadata: { brandName: brand.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json({
      success: true,
      data: { message: 'Brand deleted successfully' }
    });
  } catch (error) {
    console.error('Delete brand error:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting brand'
    });
  }
};

module.exports = {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand
};
