const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    seriesTitle: { type: String, trim: true, default: '' },
    image: { type: String, trim: true, default: '' },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    shippingAddress: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      addressLine1: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true },
      postalCode: { type: String, required: true, trim: true }
    },
    payment: {
      method: { type: String, required: true, enum: ['cod', 'bank-transfer', 'bank-account'], default: 'cod' },
      bankName: { type: String, trim: true, default: '' },
      accountNumber: { type: String, trim: true, default: '' },
      accountHolder: { type: String, trim: true, default: '' },
      reference: { type: String, trim: true, default: '' }
    },
    currencySymbol: { type: String, default: '$' },
    status: { type: String, default: 'pending', enum: ['pending', 'processing', 'packing', 'shipped', 'in-transit', 'delivered', 'cancelled', 'returned'] },
    tracking: {
      number: { type: String, trim: true, default: '' },
      carrier: { type: String, trim: true, default: '' }, // Vietnam Post, DHL, v.v.
      estimatedDelivery: { type: Date },
      actualDelivery: { type: Date },
      currentLocation: { type: String, trim: true, default: '' }
    },
    notes: { type: String, trim: true, default: '' },
    assignedWarehouse: { type: String, default: 'Main Warehouse' },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // nhân viên xử lý
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Order', orderSchema);
