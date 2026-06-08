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
    reserved: { type: Number, default: 0, min: 0 }, // quantity ordered but not yet paid
    available: { type: Number, get: function() { return this.quantity - this.reserved; } }, // virtual field
    reorderLevel: { type: Number, default: 5 }, // warning level when below this
    lastRestockDate: { type: Date },
    location: { type: String, default: 'Main Warehouse' } // warehouse location
  },
  {
    timestamps: true,
    virtuals: true,
    getters: true
  }
);

// Index for fast searching
inventorySchema.index({ productId: 1 });

// Method to check if low stock
inventorySchema.methods.isLowStock = function() {
  return this.available < this.reorderLevel;
};

// Method to update stock when order is created
inventorySchema.statics.updateReserved = async function(variantId, quantity, increment = true) {
  const operation = increment ? { $inc: { reserved: quantity } } : { $inc: { reserved: -quantity } };
  return await this.findByIdAndUpdate(variantId, operation, { new: true });
};

// Method to decrease quantity when order is fulfilled
inventorySchema.statics.decreaseStock = async function(variantId, quantity) {
  return await this.findByIdAndUpdate(
    variantId,
    { $inc: { quantity: -quantity, reserved: -quantity } },
    { new: true }
  );
};

module.exports = mongoose.model('Inventory', inventorySchema);
