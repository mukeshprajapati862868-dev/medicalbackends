// const mongoose = require('mongoose');

// const auditLogSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   role: {
//     type: String,
//     required: true,
//     enum: ['admin', 'shop_owner', 'customer']
//   },
//   action: {
//     type: String,
//     required: true,
//     enum: [
//       'login',
//       'logout',
//       'failed_login',
//       'register',
//       'medicine_created',
//       'medicine_updated',
//       'medicine_deleted',
//       'stock_changed',
//       'purchase_created',
//       'bill_created',
//       'bill_cancelled',
//       'return_created',
//       'order_created',
//       'order_updated',
//       'order_cancelled',
//       'user_created',
//       'user_updated',
//       'user_deleted',
//       'role_changed',
//       'account_disabled',
//       'account_enabled',
//       'BLOCK_SHOP_OWNER',
//       'UNBLOCK_SHOP_OWNER',
//       'supplier_created',
//       'supplier_updated',
//       'supplier_deleted',
//       'category_created',
//       'category_updated',
//       'category_deleted',
//       'brand_created',
//       'brand_updated',
//       'brand_deleted'
//     ]
//   },
//   resource: {
//     type: String,
//     required: true
//   },
//   resourceId: {
//     type: mongoose.Schema.Types.ObjectId
//   },
//   metadata: {
//     type: mongoose.Schema.Types.Mixed,
//     default: {}
//   },
//   ipAddress: {
//     type: String,
//     trim: true
//   },
//   userAgent: {
//     type: String,
//     trim: true
//   },
//   success: {
//     type: Boolean,
//     default: true
//   },
//   errorMessage: {
//     type: String,
//     trim: true
//   }
// }, {
//   timestamps: true
// });

// // Index for efficient queries
// auditLogSchema.index({ user: 1, createdAt: -1 });
// auditLogSchema.index({ action: 1, createdAt: -1 });
// auditLogSchema.index({ resource: 1, resourceId: 1, createdAt: -1 });

// module.exports = mongoose.model('AuditLog', auditLogSchema);

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },

    role: {
      type: String,
      required: true,
      enum: ['admin', 'shop_owner', 'customer', 'unknown'],
    },

    action: {
      type: String,
      required: true,
      enum: [
        'login',
        'logout',
        'failed_login',
        'register',
        'medicine_created',
        'medicine_updated',
        'medicine_deleted',
        'stock_changed',
        'purchase_created',
        'bill_created',
        'bill_cancelled',
        'return_created',
        'order_created',
        'order_updated',
        'order_cancelled',
        'user_created',
        'user_updated',
        'user_deleted',
        'role_changed',
        'account_disabled',
        'account_enabled',
        'BLOCK_SHOP_OWNER',
        'UNBLOCK_SHOP_OWNER',
        'supplier_created',
        'supplier_updated',
        'supplier_deleted',
        'category_created',
        'category_updated',
        'category_deleted',
        'brand_created',
        'brand_updated',
        'brand_deleted',
      ],
    },

    resource: {
      type: String,
      required: true,
    },

    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    ipAddress: {
      type: String,
      trim: true,
    },

    userAgent: {
      type: String,
      trim: true,
    },

    success: {
      type: Boolean,
      default: true,
    },

    errorMessage: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({
  resource: 1,
  resourceId: 1,
  createdAt: -1,
});

module.exports = mongoose.model('AuditLog', auditLogSchema);