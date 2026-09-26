const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  batchNumber: {
    type: String,
    required: [true, 'Batch number is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  purchasePrice: {
    type: Number,
    required: [true, 'Purchase price is required'],
    min: [0, 'Purchase price cannot be negative']
  },
  manufacturingDate: {
    type: Date,
    required: [true, 'Manufacturing date is required']
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required'],
    index: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  shopOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock', 'expired'],
    default: 'in_stock'
  }
}, {
  timestamps: true
});

// Compound index for medicine + batch number uniqueness per shop
batchSchema.index({ medicine: 1, batchNumber: 1, shopOwner: 1 }, { unique: true });

// Index for expiry tracking
batchSchema.index({ expiryDate: 1, shopOwner: 1 });

// Pre-save middleware to update status based on quantity and expiry
batchSchema.pre('save', function(next) {
  const today = new Date();
  const expiryDate = new Date(this.expiryDate);
  
  // Check if expired
  if (expiryDate < today) {
    this.status = 'expired';
  } else if (this.quantity === 0) {
    this.status = 'out_of_stock';
  } else if (this.quantity <= 10) {
    this.status = 'low_stock';
  } else {
    this.status = 'in_stock';
  }
  
  next();
});

// Virtual to check if near expiry (within configurable days)
batchSchema.virtual('isNearExpiry').get(function() {
  const today = new Date();
  const expiryDate = new Date(this.expiryDate);
  const nearExpiryDays = parseInt(process.env.NEAR_EXPIRY_DAYS) || 30;
  const nearExpiryDate = new Date(today);
  nearExpiryDate.setDate(nearExpiryDate.getDate() + nearExpiryDays);
  
  return expiryDate <= nearExpiryDate && expiryDate > today;
});

// Ensure virtuals are included in JSON
batchSchema.set('toJSON', { virtuals: true });
batchSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Batch', batchSchema);
