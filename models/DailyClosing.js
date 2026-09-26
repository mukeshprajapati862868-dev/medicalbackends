const mongoose = require('mongoose');

const dailyClosingSchema = new mongoose.Schema({
  shopOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true
  },
  totalSales: { type: Number, required: true, min: 0 },
  billCount: { type: Number, required: true, min: 0 },
  totalReturns: { type: Number, required: true, min: 0, default: 0 },
  cashSales: { type: Number, required: true, min: 0, default: 0 },
  upiSales: { type: Number, required: true, min: 0, default: 0 },
  cardSales: { type: Number, required: true, min: 0, default: 0 },
  otherSales: { type: Number, required: true, min: 0, default: 0 },
  notes: { type: String, trim: true },
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

dailyClosingSchema.index({ shopOwner: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyClosing', dailyClosingSchema);
