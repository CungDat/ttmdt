const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true, unique: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    lineType: {
      type: String,
      required: true,
      enum: ['truesplice', 'p3', 'poison-maelith', 'poison-candy', 'break-jump', 'limited']
    },
    lineName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    reserved: { type: Number, default: 0, min: 0 }, // số lượng được đặt nhưng chưa thanh toán
    available: { type: Number, get: function() { return this.quantity - this.reserved; } }, // virtual field
    reorderLevel: { type: Number, default: 5 }, // cảnh báo khi dưới mức này
    lastRestockDate: { type: Date },
    location: { type: String, default: 'Main Warehouse' } // vị trí kho
  },
  {
    timestamps: true,
    virtuals: true,
    getters: true
  }
);

// Index để tìm kiếm nhanh
inventorySchema.index({ productId: 1 });

// Method để check nếu sắp hết hàng
inventorySchema.methods.isLowStock = function() {
  return this.available < this.reorderLevel;
};

// Method để update tồn kho khi đơn hàng được tạo
inventorySchema.statics.updateReserved = async function(variantId, quantity, increment = true) {
  const operation = increment ? { $inc: { reserved: quantity } } : { $inc: { reserved: -quantity } };
  return await this.findByIdAndUpdate(variantId, operation, { new: true });
};

// Method để decrease quantity khi đơn hàng được fulfil
inventorySchema.statics.decreaseStock = async function(variantId, quantity) {
  return await this.findByIdAndUpdate(
    variantId,
    { $inc: { quantity: -quantity, reserved: -quantity } },
    { new: true }
  );
};

module.exports = mongoose.model('Inventory', inventorySchema);
