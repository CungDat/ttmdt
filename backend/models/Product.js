const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    sku: { type: String, required: true, unique: true, trim: true },
    name: {type: String, required: true},
    image: {type: String, required: true},
    images: { type: [String], default: [] },
    brand: {type: String, required: true},
    price: {type: Number, required: true, default: 0},
    category: {type: String, required: true},
    description: {type: String},
    specs:{
        joint: String,
        shaft: String,
        tip: String,
        weight: String
    },
    hasVariants: { type: Boolean, default: true }, // có biến thể không
    variantManaged: { type: Boolean, default: true }, // quản lý bằng variants
    countInStock: {type: Number, required: true, default: 0}, // legacy, giữ cho compatibility
    totalSales: { type: Number, default: 0 }, // tổng số bán (để analytics)
    status: { type: String, enum: ['active', 'inactive', 'discontinued'], default: 'active' }
},{
    timestamps: true
})
module.exports = mongoose.model("Product", productSchema);