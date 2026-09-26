const { Bill, Order, Batch, Medicine, Purchase, Return, User } = require('../models');
const { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } = require('date-fns');

// Get sales report
const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, period } = req.query;
    
    let dateFilter = {};
    
    if (period === 'today') {
      const today = new Date();
      dateFilter = {
        $gte: startOfDay(today),
        $lte: endOfDay(today)
      };
    } else if (period === 'month') {
      const now = new Date();
      dateFilter = {
        $gte: startOfMonth(now),
        $lte: endOfMonth(now)
      };
    } else if (startDate && endDate) {
      dateFilter = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const query = { 
      status: 'active',
      shopOwner: req.user.role === 'shop_owner' ? req.user._id : undefined
    };
    
    if (Object.keys(dateFilter).length > 0) {
      query.billDate = dateFilter;
    }
    
    // Remove undefined values
    Object.keys(query).forEach(key => query[key] === undefined && delete query[key]);
    
    const bills = await Bill.find(query)
      .populate('customer', 'name')
      .sort({ billDate: -1 });
    
    const totalSales = bills.reduce((sum, bill) => sum + bill.grandTotal, 0);
    const totalBills = bills.length;
    
    // Payment method breakdown
    const paymentBreakdown = bills.reduce((acc, bill) => {
      acc[bill.paymentMethod] = (acc[bill.paymentMethod] || 0) + bill.grandTotal;
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: {
        summary: {
          totalSales,
          totalBills,
          paymentBreakdown
        },
        bills
      }
    });
  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching sales report'
    });
  }
};

// Get stock report
const getStockReport = async (req, res) => {
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
    
    // Get various stock categories
    const inStock = await Batch.find({ ...query, status: 'in_stock' })
      .populate('medicine', 'medicineName genericName')
      .sort({ expiryDate: 1 });
    
    const lowStock = await Batch.find({ ...query, status: 'low_stock' })
      .populate('medicine', 'medicineName genericName')
      .sort({ expiryDate: 1 });
    
    const outOfStock = await Batch.find({ ...query, status: 'out_of_stock' })
      .populate('medicine', 'medicineName genericName')
      .sort({ expiryDate: 1 });
    
    const expired = await Batch.find({ ...query, status: 'expired' })
      .populate('medicine', 'medicineName genericName')
      .sort({ expiryDate: -1 });
    
    const nearExpiry = await Batch.find({
      ...query,
      expiryDate: { $lte: nearExpiryDate, $gt: today }
    })
      .populate('medicine', 'medicineName genericName')
      .sort({ expiryDate: 1 });
    
    // Calculate totals
    const totalStock = await Batch.find(query);
    const totalQuantity = totalStock.reduce((sum, batch) => sum + batch.quantity, 0);
    const totalValue = totalStock.reduce((sum, batch) => sum + (batch.quantity * batch.purchasePrice), 0);
    
    res.json({
      success: true,
      data: {
        summary: {
          totalQuantity,
          totalValue,
          inStockCount: inStock.length,
          lowStockCount: lowStock.length,
          outOfStockCount: outOfStock.length,
          expiredCount: expired.length,
          nearExpiryCount: nearExpiry.length
        },
        inStock,
        lowStock,
        outOfStock,
        expired,
        nearExpiry
      }
    });
  } catch (error) {
    console.error('Get stock report error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching stock report'
    });
  }
};

// Get expiry report
const getExpiryReport = async (req, res) => {
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
    
    // Get expired batches
    const expired = await Batch.find({
      ...query,
      expiryDate: { $lt: today }
    })
      .populate('medicine', 'medicineName genericName')
      .populate('supplier', 'name')
      .sort({ expiryDate: -1 });
    
    // Get near expiry batches
    const nearExpiry = await Batch.find({
      ...query,
      expiryDate: { $lte: nearExpiryDate, $gt: today }
    })
      .populate('medicine', 'medicineName genericName')
      .populate('supplier', 'name')
      .sort({ expiryDate: 1 });
    
    // Calculate values
    const expiredValue = expired.reduce((sum, batch) => sum + (batch.quantity * batch.purchasePrice), 0);
    const nearExpiryValue = nearExpiry.reduce((sum, batch) => sum + (batch.quantity * batch.purchasePrice), 0);
    
    res.json({
      success: true,
      data: {
        summary: {
          expiredCount: expired.length,
          expiredValue,
          nearExpiryCount: nearExpiry.length,
          nearExpiryValue,
          nearExpiryThreshold: nearExpiryDays
        },
        expired,
        nearExpiry
      }
    });
  } catch (error) {
    console.error('Get expiry report error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching expiry report'
    });
  }
};

// Get purchase report
const getPurchaseReport = async (req, res) => {
  try {
    const { startDate, endDate, period } = req.query;
    
    let dateFilter = {};
    
    if (period === 'today') {
      const today = new Date();
      dateFilter = {
        $gte: startOfDay(today),
        $lte: endOfDay(today)
      };
    } else if (period === 'month') {
      const now = new Date();
      dateFilter = {
        $gte: startOfMonth(now),
        $lte: endOfMonth(now)
      };
    } else if (startDate && endDate) {
      dateFilter = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const query = { 
      shopOwner: req.user.role === 'shop_owner' ? req.user._id : undefined
    };
    
    if (Object.keys(dateFilter).length > 0) {
      query.purchaseDate = dateFilter;
    }
    
    // Remove undefined values
    Object.keys(query).forEach(key => query[key] === undefined && delete query[key]);
    
    const purchases = await Purchase.find(query)
      .populate('supplier', 'name')
      .sort({ purchaseDate: -1 });
    
    const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.total, 0);
    const totalPurchaseCount = purchases.length;
    
    res.json({
      success: true,
      data: {
        summary: {
          totalPurchases,
          totalPurchaseCount
        },
        purchases
      }
    });
  } catch (error) {
    console.error('Get purchase report error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching purchase report'
    });
  }
};

// Get profit report
const getProfitReport = async (req, res) => {
  try {
    const { startDate, endDate, period } = req.query;
    
    let dateFilter = {};
    
    if (period === 'today') {
      const today = new Date();
      dateFilter = {
        $gte: startOfDay(today),
        $lte: endOfDay(today)
      };
    } else if (period === 'month') {
      const now = new Date();
      dateFilter = {
        $gte: startOfMonth(now),
        $lte: endOfMonth(now)
      };
    } else if (startDate && endDate) {
      dateFilter = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const query = { 
      status: 'active',
      shopOwner: req.user.role === 'shop_owner' ? req.user._id : undefined
    };
    
    if (Object.keys(dateFilter).length > 0) {
      query.billDate = dateFilter;
    }
    
    // Remove undefined values
    Object.keys(query).forEach(key => query[key] === undefined && delete query[key]);
    
    const bills = await Bill.find(query);
    
    let totalRevenue = 0;
    let totalCost = 0;
    
    for (const bill of bills) {
      totalRevenue += bill.grandTotal;
      
      // Calculate cost based on purchase price from batches
      for (const item of bill.items) {
        const batch = await Batch.findOne({
          medicine: item.medicine,
          batchNumber: item.batchNumber
        });
        
        if (batch) {
          totalCost += item.quantity * batch.purchasePrice;
        }
      }
    }
    
    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalCost,
          totalProfit,
          profitMargin: profitMargin.toFixed(2)
        }
      }
    });
  } catch (error) {
    console.error('Get profit report error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching profit report'
    });
  }
};

// Get dashboard data
const getDashboardData = async (req, res) => {
  try {
    const query = {};
    
    // Role-based filtering
    if (req.user.role === 'shop_owner') {
      query.shopOwner = req.user._id;
    }
    
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    
    // Today's sales
    const todayBills = await Bill.find({
      ...query,
      status: 'active',
      billDate: { $gte: todayStart, $lte: todayEnd }
    });
    
    const todaySales = todayBills.reduce((sum, bill) => sum + bill.grandTotal, 0);
    const todayBillCount = todayBills.length;
    
    // Total medicines
    const totalMedicines = await Medicine.countDocuments(query);
    
    // Stock summary
    const batches = await Batch.find(query);
    const totalStock = batches.reduce((sum, batch) => sum + batch.quantity, 0);
    const lowStockCount = await Batch.countDocuments({ ...query, status: 'low_stock' });
    const outOfStockCount = await Batch.countDocuments({ ...query, status: 'out_of_stock' });
    
    // Expiry summary
    const nearExpiryDays = parseInt(process.env.NEAR_EXPIRY_DAYS) || 30;
    const nearExpiryDate = new Date(today);
    nearExpiryDate.setDate(nearExpiryDate.getDate() + nearExpiryDays);
    
    const expiredCount = await Batch.countDocuments({ ...query, status: 'expired' });
    const nearExpiryCount = await Batch.countDocuments({
      ...query,
      expiryDate: { $lte: nearExpiryDate, $gt: today }
    });
    
    // Orders summary
    const pendingOrders = await Order.countDocuments({
      ...query,
      status: 'pending'
    });
    
    const completedOrders = await Order.countDocuments({
      ...query,
      status: 'completed'
    });
    
    // Customers count
    const customersCount = await User.countDocuments({ role: 'customer' });
    
    // Purchases
    const todayPurchases = await Purchase.find({
      ...query,
      purchaseDate: { $gte: todayStart, $lte: todayEnd }
    });
    
    const totalPurchases = todayPurchases.reduce((sum, purchase) => sum + purchase.total, 0);
    
    res.json({
      success: true,
      data: {
        today: {
          sales: todaySales,
          billCount: todayBillCount,
          purchases: totalPurchases
        },
        inventory: {
          totalMedicines,
          totalStock,
          lowStock: lowStockCount,
          outOfStock: outOfStockCount,
          expired: expiredCount,
          nearExpiry: nearExpiryCount
        },
        orders: {
          pending: pendingOrders,
          completed: completedOrders
        },
        customers: customersCount
      }
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching dashboard data'
    });
  }
};

module.exports = {
  getSalesReport,
  getStockReport,
  getExpiryReport,
  getPurchaseReport,
  getProfitReport,
  getDashboardData
};
