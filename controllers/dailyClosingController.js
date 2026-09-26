const { Bill, DailyClosing, Return: ReturnModel } = require('../models');

const startOfDay = value => {
  const date = value ? new Date(value) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const buildSummary = async (shopOwner, date) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);
  const base = { shopOwner, billDate: { $gte: date, $lt: nextDate } };
  const bills = await Bill.find({ ...base, status: { $ne: 'cancelled' } }).select('grandTotal paymentMethod');
  const returns = await ReturnModel.find({ shopOwner, returnDate: { $gte: date, $lt: nextDate } }).select('refundAmount');
  const summary = { totalSales: 0, billCount: bills.length, totalReturns: returns.reduce((sum, item) => sum + item.refundAmount, 0), cashSales: 0, upiSales: 0, cardSales: 0, otherSales: 0 };
  for (const bill of bills) {
    summary.totalSales += bill.grandTotal;
    const key = `${bill.paymentMethod}Sales`;
    if (key in summary) summary[key] += bill.grandTotal;
    else summary.otherSales += bill.grandTotal;
  }
  return summary;
};

const getDailyClosing = async (req, res) => {
  try {
    const date = startOfDay(req.query.date);
    const summary = await buildSummary(req.user._id, date);
    const closing = await DailyClosing.findOne({ shopOwner: req.user._id, date });
    res.json({ success: true, data: { date, summary, closing } });
  } catch (error) {
    console.error('Get daily closing error:', error);
    res.status(500).json({ success: false, error: 'Error fetching daily closing' });
  }
};

const closeDay = async (req, res) => {
  try {
    const date = startOfDay(req.body.date);
    const summary = await buildSummary(req.user._id, date);
    const closing = await DailyClosing.findOneAndUpdate({ shopOwner: req.user._id, date }, { ...summary, notes: req.body.notes, closedBy: req.user._id }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
    res.status(201).json({ success: true, data: { closing } });
  } catch (error) {
    console.error('Close day error:', error);
    res.status(500).json({ success: false, error: 'Error closing day' });
  }
};

module.exports = { getDailyClosing, closeDay };
