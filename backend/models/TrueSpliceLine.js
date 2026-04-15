const mongoose = require('mongoose');

const trueSpliceLineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: { type: String, required: true },
    lineSeriesImage: { type: String, default: '' },
    price: { type: Number, required: true, default: 1498 },
    currencySymbol: { type: String, default: '$' },
    link: { type: String, default: '/' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('TrueSpliceLine', trueSpliceLineSchema);
