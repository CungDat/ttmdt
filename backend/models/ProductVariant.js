const mongoose = require('mongoose');

// Định nghĩa các variant options khả dụng
const variantOptionsSchema = new mongoose.Schema({
  shaftTypes: { type: [String], default: ['Revo', 'Z-3', '314-3', 'Vantage', 'Pro', 'Carbon'] },
  jointTypes: { type: [String], default: ['Uni-Loc', 'Radial', 'Quick Release'] },
  weights: { type: [String], default: ['18.5 oz', '19 oz', '19.5 oz', '20 oz'] },
  wrapTypes: { type: [String], default: ['Linen', 'Leather', 'No Wrap'] }
}, { _id: false });

const productVariantSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    lineType: {
      type: String,
      required: true,
      enum: ['truesplice', 'p3', 'poison-maelith', 'poison-candy', 'break-jump', 'limited']
    },
    lineName: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true },
    shaft: { type: String, required: true, trim: true },
    joint: { type: String, required: true, trim: true },
    weight: { type: String, required: true, trim: true },
    wrap: { type: String, required: true, trim: true },
    priceAdjustment: { type: Number, default: 0 }, // giá thêm so với base price
    status: { type: String, enum: ['active', 'inactive', 'discontinued'], default: 'active' }
  },
  {
    timestamps: true
  }
);

// Index để tìm kiếm nhanh combinations
productVariantSchema.index({ productId: 1, status: 1 });

module.exports = {
  ProductVariant: mongoose.model('ProductVariant', productVariantSchema),
  VariantOptions: mongoose.model('VariantOptions', new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    ...variantOptionsSchema.obj
  }, { timestamps: true }))
};
