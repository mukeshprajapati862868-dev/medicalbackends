const mongoose = require('mongoose');
const { Bill, Return: ReturnModel, Batch } = require('../models');
const { createAuditLog } = require('../services/auditService');

const getReturns = async (req, res) => {
  try {
    const query = req.user.role === 'shop_owner' ? { shopOwner: req.user._id } : {};
    const returns = await ReturnModel.find(query)
      .populate('bill', 'billNumber billDate')
      .populate('customer', 'name email mobile')
      .sort({ returnDate: -1 });
    res.json({ success: true, data: { returns } });
  } catch (error) {
    console.error('Get returns error:', error);
    res.status(500).json({ success: false, error: 'Error fetching returns' });
  }
};

const createReturn = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { billId, items, reason, refundMethod = 'cash', notes } = req.body;
    const bill = await Bill.findOne({ _id: billId, shopOwner: req.user._id }).session(session);
    if (!bill) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }
    if (bill.status !== 'active') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: 'Only active bills can be returned' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: 'At least one return item is required' });
    }

    const processedItems = [];
    let subtotal = 0;
    for (const requested of items) {
      const billItem = bill.items.find(item => String(item.medicine) === String(requested.medicine) && item.batchNumber === requested.batchNumber);
      if (!billItem || requested.quantity < 1 || requested.quantity > billItem.quantity) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, error: 'Invalid return quantity or bill item' });
      }
      const lineTotal = requested.quantity * billItem.unitPrice;
      processedItems.push({
        medicine: billItem.medicine,
        medicineNameSnapshot: billItem.medicineNameSnapshot,
        batchNumber: billItem.batchNumber,
        quantity: requested.quantity,
        unitPrice: billItem.unitPrice,
        lineTotal
      });
      subtotal += lineTotal;

      const batch = await Batch.findOne({
        medicine: billItem.medicine,
        batchNumber: billItem.batchNumber,
        shopOwner: req.user._id
      }).session(session);
      if (!batch) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, error: 'Batch no longer exists for returned item' });
      }
      batch.quantity += requested.quantity;
      await batch.save({ session });
    }

    const created = await ReturnModel.create([{
      returnNumber: `RET-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      bill: bill._id,
      customer: bill.customer,
      items: processedItems,
      subtotal,
      refundAmount: subtotal,
      reason,
      refundMethod,
      notes,
      shopOwner: req.user._id
    }], { session });

    bill.status = 'returned';
    await bill.save({ session });
    await session.commitTransaction();
    await createAuditLog({ user: req.user._id, role: req.user.role, action: 'return_created', resource: 'Return', resourceId: created[0]._id, metadata: { bill: bill.billNumber, refundAmount: subtotal }, ipAddress: req.ip, userAgent: req.get('user-agent') });
    res.status(201).json({ success: true, data: { return: created[0] } });
  } catch (error) {
    await session.abortTransaction();
    console.error('Create return error:', error);
    res.status(500).json({ success: false, error: 'Error creating return' });
  } finally {
    session.endSession();
  }
};

module.exports = { getReturns, createReturn };
