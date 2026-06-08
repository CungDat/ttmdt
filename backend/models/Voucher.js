const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 32
    },
    description: { type: String, trim: true, default: '' },
    type: {
      type: String,
      required: true,
      enum: ['percent', 'fixed', 'freeship']
    },
    // Giá trị giảm: % hoặc VNĐ cố định
    value: { type: Number, required: true, min: 0 },
    // Đơn tối thiểu để áp dụng
    minOrderValue: { type: Number, default: 0, min: 0 },
    // Giảm tối đa (dùng cho percent để không bị lợi dụng)
    maxDiscount: { type: Number, default: 0, min: 0 },
    // Giới hạn số lần dùng tổng (0 = không giới hạn)
    usageLimit: { type: Number, default: 0, min: 0 },
    // Đã dùng bao nhiêu lần
    usedCount: { type: Number, default: 0, min: 0 },
    // Giới hạn mỗi người dùng (0 = không giới hạn)
    perUserLimit: { type: Number, default: 1, min: 0 },
    // Ngày bắt đầu và kết thúc
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    // Trạng thái
    isActive: { type: Boolean, default: true },
    // Danh sách user đã dùng (để track per-user limit)
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Admin tạo voucher
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Index để tìm kiếm nhanh theo code
voucherSchema.index({ code: 1 });
voucherSchema.index({ isActive: 1, endDate: 1 });

// Method kiểm tra voucher có hợp lệ không
voucherSchema.methods.validateVoucher = function (userId, subtotal) {
  if (!this.isActive) return { valid: false, error: 'Voucher code has been disabled' };

  const now = new Date();
  if (this.startDate && now < this.startDate) {
    return { valid: false, error: 'Voucher code is not yet active' };
  }
  if (this.endDate && now > this.endDate) {
    return { valid: false, error: 'Voucher code has expired' };
  }
  if (this.usageLimit > 0 && this.usedCount >= this.usageLimit) {
    return { valid: false, error: 'Voucher code usage limit reached' };
  }
  if (this.minOrderValue > 0 && subtotal < this.minOrderValue) {
    return { valid: false, error: `Minimum order value of $${this.minOrderValue.toFixed(2)} is required to use this voucher` };
  }
  if (userId && this.perUserLimit > 0) {
    const userUsedCount = this.usedBy.filter(
      (id) => String(id) === String(userId)
    ).length;
    if (userUsedCount >= this.perUserLimit) {
      return { valid: false, error: 'You have already used this voucher' };
    }
  }
  return { valid: true, error: null };
};

// Method tính discount
voucherSchema.methods.calculateDiscount = function (subtotal, shippingFee) {
  if (this.type === 'percent') {
    let discount = Math.round((subtotal * this.value) / 100);
    if (this.maxDiscount > 0) discount = Math.min(discount, this.maxDiscount);
    return { discount, shippingFee };
  }
  if (this.type === 'fixed') {
    return { discount: Math.min(this.value, subtotal), shippingFee };
  }
  if (this.type === 'freeship') {
    return { discount: 0, shippingFee: 0 };
  }
  return { discount: 0, shippingFee };
};

// Method ghi nhận đã dùng
voucherSchema.methods.markUsed = async function (userId) {
  this.usedCount += 1;
  if (userId) this.usedBy.push(userId);
  return this.save();
};

module.exports = mongoose.model('Voucher', voucherSchema);
