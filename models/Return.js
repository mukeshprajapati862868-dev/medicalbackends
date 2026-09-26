const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  returnNumber: {
    type: String,
    required: [true, 'Return number is required'],
    unique: true,
    trim: true
  },
  bill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill',
    required: true
  },
  returnDate: {
    type: Date,
    required: [true, 'Return date is required'],
    default: Date.now
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  items: [{
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true
    },
    medicineNameSnapshot: {
      type: String,
      required: true
    },
    batchNumber: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, 'Unit price cannot be negative']
    },
    lineTotal: {
      type: Number,
      required: true
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  refundAmount: {
    type: Number,
    required: true,
    min: [0, 'Refund amount cannot be negative']
  },
  reason: {
    type: String,
    required: [true, 'Return reason is required'],
    trim: true
  },
  refundMethod: {
    type: String,
    enum: ['cash', 'upi', 'card', 'bank_transfer', 'credit'],
    default: 'cash'
  },
  notes: {
    type: String,
    trim: true
  },
  shopOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Return', returnSchema);
