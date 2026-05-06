const mongoose = require('mongoose');

const accessoryLineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: { type: String, default: '' },
    images: { type: [String], default: [] },
    price: { type: Number, required: true, default: 0 },
    currencySymbol: { type: String, default: '$' },
    link: { type: String, default: '/' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AccessoryLine', accessoryLineSchema);
