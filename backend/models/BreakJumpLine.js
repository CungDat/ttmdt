const mongoose = require('mongoose');

const breakJumpLineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    images: { type: [String], default: [] },
    lineSeriesImage: { type: String, default: '' },
    price: { type: Number, required: true, default: 0 },
    currencySymbol: { type: String, default: '$' },
    link: { type: String, default: '/' },
    badge: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('BreakJumpLine', breakJumpLineSchema);
