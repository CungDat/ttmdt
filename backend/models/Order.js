const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true, trim: true },
    productId: { type: mongoose.Schema.Types.ObjectId, required: false },
    lineType: { type: String, trim: true, default: '' },
    lineName: { type: String, trim: true, default: '' },
    name: { type: String, required: true, trim: true },
    seriesTitle: { type: String, trim: true, default: '' },
    image: { type: String, trim: true, default: '' },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    // Build Your Own Cue configuration
    configuration: {
      shaft: { type: String, trim: true, default: '' },
      tip: { type: String, trim: true, default: '' },
      weight: { type: String, trim: true, default: '' },
      shaftUpcharge: { type: Number, default: 0 },
      tipUpcharge: { type: Number, default: 0 },
      weightUpcharge: { type: Number, default: 0 }
    }
  },
  { _id: false }
);

const statusHistoryEntrySchema = new mongoose.Schema(
  {
    status: { type: String, required: true, trim: true },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, trim: true, default: '' }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    voucherCode: { type: String, trim: true, default: '' },
    total: { type: Number, default: 0, min: 0 },
    shippingAddress: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      addressLine1: { type: String, required: true, trim: true },
      ward: { type: String, trim: true, default: '' },
      district: { type: String, trim: true, default: '' },
      city: { type: String, required: true, trim: true },
      province: { type: String, trim: true, default: '' },
      country: { type: String, required: true, trim: true },
      postalCode: { type: String, required: true, trim: true }
    },
    payment: {
      method: { type: String, required: true, enum: ['cod', 'bank-transfer', 'bank-account', 'vnpay'], default: 'cod' },
      bankName: { type: String, trim: true, default: '' },
      accountNumber: { type: String, trim: true, default: '' },
      accountHolder: { type: String, trim: true, default: '' },
      reference: { type: String, trim: true, default: '' }
    },
    currencySymbol: { type: String, default: '$' },
    status: { type: String, default: 'pending', enum: ['pending', 'paid', 'processing', 'packing', 'shipped', 'in-transit', 'delivered', 'cancelled', 'returned'] },
    statusHistory: { type: [statusHistoryEntrySchema], default: [] },
    tracking: {
      number: { type: String, trim: true, default: '' },
      carrier: { type: String, trim: true, default: '' },
      estimatedDelivery: { type: Date },
      actualDelivery: { type: Date },
      currentLocation: { type: String, trim: true, default: '' }
    },
    notes: { type: String, trim: true, default: '' },
    assignedWarehouse: { type: String, default: 'Main Warehouse' },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Order', orderSchema);
