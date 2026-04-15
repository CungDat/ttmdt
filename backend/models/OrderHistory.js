const mongoose = require('mongoose');

const orderHistorySchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'packing', 'shipped', 'in-transit', 'delivered', 'cancelled', 'returned'],
      required: true
    },
    reason: { type: String, trim: true }, // lý do thay đổi trạng thái
    notes: { type: String, trim: true }, // ghi chú của staff
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // nhân viên cập nhật
    trackingNumber: { type: String, trim: true, default: '' }, // mã tracking vận chuyển
    estimatedDelivery: { type: Date }, // ngày dự kiến giao
    actualDelivery: { type: Date }, // ngày giao thực tế
    location: { type: String, trim: true, default: '' } // vị trí hiện tại
  },
  {
    timestamps: true
  }
);

orderHistorySchema.index({ orderId: 1, createdAt: -1 });

module.exports = mongoose.model('OrderHistory', orderHistorySchema);
