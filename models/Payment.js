const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  bill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill',
    required: true
  },
  shopOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  method: {
    type: String,
    enum: ['cash', 'upi', 'card', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['paid', 'refunded', 'void'],
    default: 'paid'
  },
  reference: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

paymentSchema.index({ shopOwner: 1, createdAt: -1 });
paymentSchema.index({ bill: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
