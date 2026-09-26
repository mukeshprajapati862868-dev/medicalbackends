const { Payment, Bill } = require('../models');

const getPayments = async (req, res) => {
  try {
    const query = req.user.role === 'shop_owner' ? { shopOwner: req.user._id } : {};
    const payments = await Payment.find(query).populate('bill', 'billNumber billDate grandTotal').sort({ createdAt: -1 });
    res.json({ success: true, data: { payments } });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ success: false, error: 'Error fetching payments' });
  }
};

const createPayment = async (req, res) => {
  try {
    const { billId, amount, method, reference, notes } = req.body;
    const bill = await Bill.findOne({ _id: billId, shopOwner: req.user._id });
    if (!bill) return res.status(404).json({ success: false, error: 'Bill not found' });
    if (!Number.isFinite(amount) || amount <= 0 || amount > bill.grandTotal) {
      return res.status(400).json({ success: false, error: 'Payment amount is invalid' });
    }
    const payment = await Payment.create({ bill: bill._id, shopOwner: req.user._id, amount, method, reference, notes, recordedBy: req.user._id });
    res.status(201).json({ success: true, data: { payment } });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ success: false, error: 'Error creating payment' });
  }
};

module.exports = { getPayments, createPayment };
