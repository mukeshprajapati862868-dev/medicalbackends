// // const mongoose = require('mongoose');
// //     enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'other'],
// //     default: 'tablet'
// //   },
// //   mrp: {
// //     type: Number,
// //     required: [true, 'MRP is required'],
// //     min: [0, 'MRP cannot be negative']
// //   },
// //   defaultPrice: {
// //     type: Number,
// //     required: [true, 'Default price is required'],
// //     min: [0, 'Default price cannot be negative']
// //   },
// //   gst: {
// //     type: Number,
// //     default: 0,
// //     min: [0, 'GST cannot be negative'],
// //     max: [100, 'GST cannot exceed 100%']
// //   },
// //   hsnCode: {
// //     type: String,
// //     trim: true
// //   },
// //   minimumStockLevel: {
// //     type: Number,
// //     default: 10,
// //     min: [0, 'Minimum stock level cannot be negative']
// //   },
// //   prescriptionRequired: {
// //     type: Boolean,
// //     default: false
// //   },
// //   description: {
// //     type: String,
// //     trim: true
// //   },
// //   image: {
// //     type: String,
// //     trim: true
// //   },
// //   status: {
// //     type: String,
// //     enum: ['active', 'inactive', 'discontinued'],
// //     default: 'active'
// //   },
// //   shopOwner: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     ref: 'User',
// //     required: true
// //   }
// // }, {
// //   timestamps: true
// // });

// // // Index for search
// // medicineSchema.index({ medicineName: 'text', genericName: 'text', composition: 'text' });

// // module.exports = mongoose.model('Medicine', medicineSchema);

// const mongoose = require('mongoose');

// const medicineSchema = new mongoose.Schema(
//   {
//     medicineName: {
//       type: String,
//       required: [true, 'Medicine name is required'],
//       trim: true,
//       index: true,
//     },

//     genericName: {
//       type: String,
//       trim: true,
//       index: true,
//       default: '',
//     },

//     brand: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Brand',
//       default: null,
//     },

//     category: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Category',
//       default: null,
//     },

//     manufacturer: {
//       type: String,
//       trim: true,
//       default: '',
//     },

//     composition: {
//       type: String,
//       trim: true,
//       default: '',
//     },

//     strength: {
//       type: String,
//       trim: true,
//       default: '',
//     },

//     dosage: {
//       type: String,
//       trim: true,
//       default: '',
//     },

//     packSize: {
//       type: String,
//       trim: true,
//       default: '',
//     },

//     unit: {
//       type: String,
//       enum: [
//         'tablet',
//         'capsule',
//         'syrup',
//         'injection',
//         'cream',
//         'ointment',
//         'drops',
//         'inhaler',
//         'other',
//       ],
//       default: 'tablet',
//     },

//     mrp: {
//       type: Number,
//       required: [true, 'MRP is required'],
//       min: [0, 'MRP cannot be negative'],
//     },

//     defaultPrice: {
//       type: Number,
//       required: [true, 'Default price is required'],
//       min: [0, 'Default price cannot be negative'],
//     },

//     gst: {
//       type: Number,
//       default: 0,
//       min: [0, 'GST cannot be negative'],
//       max: [100, 'GST cannot exceed 100%'],
//     },

//     /*
//      * IMPORTANT
//      * CustomerHomeScreen stock isi field se read karega.
//      */
//     stock: {
//       type: Number,
//       default: 0,
//       min: [0, 'Stock cannot be negative'],
//     },

//     hsnCode: {
//       type: String,
//       trim: true,
//       default: '',
//     },

//     minimumStockLevel: {
//       type: Number,
//       default: 10,
//       min: [0, 'Minimum stock level cannot be negative'],
//     },

//     prescriptionRequired: {
//       type: Boolean,
//       default: false,
//     },

//     description: {
//       type: String,
//       trim: true,
//       default: '',
//     },

//     image: {
//       type: String,
//       trim: true,
//       default: '',
//     },

//     status: {
//       type: String,
//       enum: ['active', 'inactive', 'discontinued'],
//       default: 'active',
//       index: true,
//     },

//     shopOwner: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: [true, 'Shop owner is required'],
//       index: true,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// /*
//  * Search index
//  */
// medicineSchema.index({
//   medicineName: 'text',
//   genericName: 'text',
//   composition: 'text',
// });

// /*
//  * Useful indexes
//  */
// medicineSchema.index({
//   shopOwner: 1,
//   status: 1,
//   createdAt: -1,
// });

// module.exports = mongoose.model('Medicine', medicineSchema);


const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    batchNumber: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true,
    },

    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },

    stock: {
      type: Number,
      required: [true, 'Batch stock is required'],
      min: [0, 'Batch stock cannot be negative'],
    },

    unit: {
      type: String,
      enum: [
        'tablet',
        'capsule',
        'syrup',
        'injection',
        'cream',
        'ointment',
        'drops',
        'inhaler',
        'other',
      ],
      required: true,
    },
  },
  {
    _id: true,
  }
);

const medicineSchema = new mongoose.Schema(
  {
    medicineName: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
      index: true,
    },

    unit: {
      type: String,
      enum: [
        'tablet',
        'capsule',
        'syrup',
        'injection',
        'cream',
        'ointment',
        'drops',
        'inhaler',
        'other',
      ],
      required: true,
    },

    mrp: {
      type: Number,
      required: [true, 'MRP is required'],
      min: [0, 'MRP cannot be negative'],
    },

    defaultPrice: {
      type: Number,
      required: [true, 'Default price is required'],
      min: [0, 'Default price cannot be negative'],
    },

    purchasePrice: {
      type: Number,
      required: true,
      min: [0, 'Purchase price cannot be negative'],
    },

    gst: {
      type: Number,
      default: 0,
      min: [0, 'GST cannot be negative'],
      max: [100, 'GST cannot exceed 100%'],
    },

    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
    },

    enableBatchTracking: {
      type: Boolean,
      default: false,
    },

    batches: {
      type: [batchSchema],
      default: [],
    },

    hsnCode: {
      type: String,
      trim: true,
      default: '',
    },

    minimumStockLevel: {
      type: Number,
      default: 10,
      min: [0, 'Minimum stock level cannot be negative'],
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'discontinued'],
      default: 'active',
      index: true,
    },

    shopOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Shop owner is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

medicineSchema.index({
  shopOwner: 1,
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  'Medicine',
  medicineSchema
);